import { WebSocketApi, WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';
import { WebSocketIamAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import {
  aws_certificatemanager as acm,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfrontOrigins,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_s3 as s3,
  aws_secretsmanager as secretsmanager
} from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as path from 'path';
import type { CDKContext } from './types';

/**
 * JPYC AI Agent Core CDK Stack Props
 */
export interface CdkStackProps extends cdk.StackProps {
  /**
   * CDK Context設定
   */
  context: CDKContext;
}

/**
 * JPYC AI Agent Core CDK Stack
 * 
 * 完全サーバーレス構成でJPYC AI Agentアプリケーションをデプロイ
 * - S3 + CloudFront: Next.js Static Export
 * - Lambda (AgentCore): Mastra Agent実行（Bedrock AgentCore Runtime）
 * - Lambda (MCP Server): JPYC SDK操作
 * - DynamoDB: セッション管理
 * - API Gateway: WebSocketでリアルタイム通信
 */
export class CdkStack extends cdk.Stack {
  /**
   * CDK Context設定
   */
  public readonly context: CDKContext;

  /**
   * PRIVATE_KEY Secret
   */
  public readonly privateKeySecret: secretsmanager.ISecret;

  /**
   * ANTHROPIC_API_KEY Secret
   */
  public readonly anthropicApiKeySecret: secretsmanager.ISecret;

  /**
   * DynamoDB Session Store Table
   */
  public readonly sessionTable: dynamodb.Table;

  /**
   * S3 Bucket for Static Website Hosting
   */
  public readonly frontendBucket: s3.Bucket;

  /**
   * CloudFront Distribution
   */
  public readonly distribution: cloudfront.Distribution;

  /**
   * MCP Server Lambda Function
   */
  public readonly mcpServerFunction: lambda.Function;

  /**
   * MCP Server Lambda Function URL
   */
  public readonly mcpServerFunctionUrl: lambda.FunctionUrl;

  /**
   * AgentCore Lambda Function
   */
  public readonly agentCoreFunction: lambda.Function;

  /**
   * WebSocket API
   */
  public readonly webSocketApi: WebSocketApi;

  /**
   * WebSocket Stage
   */
  public readonly webSocketStage: WebSocketStage;

  /**
   * コンストラクター
   * @param scope CDK App
   * @param id スタックID
   * @param props スタックプロパティ
   */
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    this.context = props.context;

    // タグを追加
    cdk.Tags.of(this).add('Project', 'JPYC-AI-Agent');
    cdk.Tags.of(this).add('Environment', this.context.environment ?? 'production');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Secrets Manager構築
    const secrets = this.createSecretsManager();
    this.privateKeySecret = secrets.privateKeySecret;
    this.anthropicApiKeySecret = secrets.anthropicApiKeySecret;

    // DynamoDB Session Store構築
    this.sessionTable = this.createSessionTable();

    // S3 Bucket構築（Static Website Hosting）
    this.frontendBucket = this.createFrontendBucket();

    // CloudFront Distribution構築
    this.distribution = this.createCloudFrontDistribution();

    // Lambda Function (MCP Server) 構築
    const mcpServer = this.createMcpServerFunction();
    this.mcpServerFunction = mcpServer.function;
    this.mcpServerFunctionUrl = mcpServer.functionUrl;

    // Lambda Function (AgentCore) 構築
    this.agentCoreFunction = this.createAgentCoreFunction();

    // API Gateway WebSocket構築
    const webSocket = this.createWebSocketApi();
    this.webSocketApi = webSocket.api;
    this.webSocketStage = webSocket.stage;

    // TODO: 各リソースの構築
    // - CloudWatch Alarms
  }

  /**
   * Secrets Managerリソースを作成
   * 
   * CDK Contextで既存のシークレットARNが指定されている場合は、
   * 既存のシークレットをインポートします。
   * 指定されていない場合は、新規にシークレットを作成します。
   * 
   * @returns PRIVATE_KEYとANTHROPIC_API_KEYのシークレット
   */
  private createSecretsManager(): {
    privateKeySecret: secretsmanager.ISecret;
    anthropicApiKeySecret: secretsmanager.ISecret;
  } {
    // PRIVATE_KEY Secret
    let privateKeySecret: secretsmanager.ISecret;
    if (this.context.privateKeySecretArn) {
      // 既存のシークレットをインポート
      privateKeySecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'ImportedPrivateKeySecret',
        this.context.privateKeySecretArn
      );
    } else {
      // 新規にシークレットを作成
      privateKeySecret = new secretsmanager.Secret(this, 'PrivateKeySecret', {
        secretName: 'jpyc-ai-agent/private-key',
        description: 'Ethereum private key for blockchain transactions',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ key: 'placeholder' }),
          generateStringKey: 'value',
        },
      });
    }

    // ANTHROPIC_API_KEY Secret
    let anthropicApiKeySecret: secretsmanager.ISecret;
    if (this.context.anthropicApiKeySecretArn) {
      // 既存のシークレットをインポート
      anthropicApiKeySecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'ImportedAnthropicApiKeySecret',
        this.context.anthropicApiKeySecretArn
      );
    } else {
      // 新規にシークレットを作成
      anthropicApiKeySecret = new secretsmanager.Secret(this, 'AnthropicApiKeySecret', {
        secretName: 'jpyc-ai-agent/anthropic-api-key',
        description: 'Anthropic API key for Claude 3.5 Sonnet',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ key: 'placeholder' }),
          generateStringKey: 'value',
        },
      });
    }

    return {
      privateKeySecret,
      anthropicApiKeySecret,
    };
  }

  /**
   * DynamoDB Session Storeテーブルを作成
   * 
   * セッション管理と会話履歴を保存するためのDynamoDBテーブルを作成します。
   * - Partition Key: sessionId (String)
   * - Sort Key: timestamp (Number)
   * - TTL: 24時間（デフォルト、CDK Contextで変更可能）
   * - Billing Mode: PAY_PER_REQUEST（デフォルト、CDK Contextで変更可能）
   * - Point-in-Time Recovery: 有効化
   * - Encryption: AWS Managed Key
   * 
   * @returns DynamoDB Session Storeテーブル
   */
  private createSessionTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'SessionTable', {
      tableName: 'jpyc-ai-agent-sessions',
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: this.context.sessionTableBillingMode === 'PROVISIONED'
        ? dynamodb.BillingMode.PROVISIONED
        : dynamodb.BillingMode.PAY_PER_REQUEST,
      // PROVISIONEDモードの場合のみ読み書き容量を設定
      ...(this.context.sessionTableBillingMode === 'PROVISIONED' && {
        readCapacity: 5,
        writeCapacity: 5,
      }),
      // TTL設定（24時間後に自動削除）
      timeToLiveAttribute: 'ttl',
      // Point-in-Time Recovery有効化
      pointInTimeRecovery: true,
      // 暗号化（AWS Managed Key）
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // 削除保護（本番環境では有効化を推奨）
      removalPolicy: this.context.environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    return table;
  }

  /**
   * S3 Bucket（Static Website Hosting）を作成
   * 
   * Next.js Static ExportをホスティングするためのS3バケットを作成します。
   * - バケット名: jpyc-ai-agent-frontend
   * - バージョニング: 有効化（ロールバック用）
   * - 暗号化: AES-256 (SSE-S3)
   * - パブリックアクセス: ブロック（CloudFront経由のみアクセス可能）
   * - Lifecycle Policy: 古いバージョンを30日後に削除
   * 
   * @returns S3 Bucket
   */
  private createFrontendBucket(): s3.Bucket {
    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: 'jpyc-ai-agent-frontend',
      // バージョニング有効化（ロールバック用）
      versioned: true,
      // 暗号化: AES-256 (SSE-S3)
      encryption: s3.BucketEncryption.S3_MANAGED,
      // パブリックアクセスブロック（CloudFront経由のみアクセス可能）
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // Lifecycle Policy（古いバージョンを30日後に削除）
      lifecycleRules: [
        {
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      // 削除保護（本番環境では保持、開発環境では削除）
      removalPolicy: this.context.environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      // 削除時にバケット内のオブジェクトも削除（開発環境のみ）
      autoDeleteObjects: this.context.environment !== 'production',
    });

    return bucket;
  }

  /**
   * CloudFront Distributionを作成
   * 
   * S3バケットをオリジンとするCloudFront Distributionを作成します。
   * - Origin: S3 Bucket (OAI経由)
   * - Default Root Object: index.html
   * - HTTP → HTTPS リダイレクト
   * - Custom Error Responses (404, 403 → /index.html) - SPA routing対応
   * - Cache Behavior: CachingOptimized
   * - HTTP Version: HTTP/2, HTTP/3
   * - Compression: 有効化
   * - Price Class: PriceClass_All（グローバル配信）
   * - TLS: TLSv1.2以上
   * 
   * @returns CloudFront Distribution
   */
  private createCloudFrontDistribution(): cloudfront.Distribution {
    // Origin Access Identity (OAI) を作成
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for JPYC AI Agent Frontend',
    });

    // CloudFront Distribution設定
    let distributionProps: cloudfront.DistributionProps;

    // カスタムドメインが指定されている場合
    if (this.context.domainName && this.context.certificateArn) {
      // ACM証明書をインポート
      const certificate = acm.Certificate.fromCertificateArn(
        this,
        'Certificate',
        this.context.certificateArn
      );

      distributionProps = {
        // デフォルトビヘイビア
        defaultBehavior: {
          origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessIdentity(this.frontendBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        // デフォルトルートオブジェクト
        defaultRootObject: 'index.html',
        // HTTPバージョン
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        // Price Class（グローバル配信）
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        // カスタムエラーレスポンス（SPA routing対応）
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
        // 有効化
        enabled: true,
        // カスタムドメイン設定
        domainNames: [this.context.domainName],
        certificate,
      };
    } else {
      distributionProps = {
        // デフォルトビヘイビア
        defaultBehavior: {
          origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessIdentity(this.frontendBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        // デフォルトルートオブジェクト
        defaultRootObject: 'index.html',
        // HTTPバージョン
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        // Price Class（グローバル配信）
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        // カスタムエラーレスポンス（SPA routing対応）
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
        // 有効化
        enabled: true,
      };
    }

    // CloudFront Distributionを作成
    const distribution = new cloudfront.Distribution(this, 'Distribution', distributionProps);

    // CloudFront Distribution URLを出力
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: 'JPYCAIAgentDistributionDomainName',
    });

    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: 'JPYCAIAgentDistributionUrl',
    });

    return distribution;
  }

  /**
   * Lambda Function (MCP Server) を作成
   * 
   * JPYC SDK操作を行うMCP Server Lambda関数を作成します。
   * - Runtime: Node.js 20.x
   * - Memory: 512 MB（デフォルト、CDK Contextで変更可能）
   * - Timeout: 60秒（デフォルト、CDK Contextで変更可能）
   * - Architecture: arm64 (Graviton2 - コスト効率)
   * - Function URL: 有効化（IAM認証）
   * - 環境変数: NODE_ENV, PRIVATE_KEY (Secrets Manager)
   * 
   * IAM Permissions:
   * - Secrets Manager GetSecretValue: PRIVATE_KEYシークレットの読み取り（Requirements 3.3）
   * - CloudWatch Logs: ログ書き込み権限（Requirements 3.6）
   * 
   * @returns MCP Server Lambda FunctionとFunction URL
   */
  private createMcpServerFunction(): { function: lambda.Function; functionUrl: lambda.FunctionUrl } {
    // Lambda実行ロール作成
    const executionRole = new iam.Role(this, 'McpServerExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for JPYC AI Agent MCP Server Lambda',
      managedPolicies: [
        // CloudWatch Logsへの書き込み権限（Requirements 3.6）
        // - logs:CreateLogGroup
        // - logs:CreateLogStream
        // - logs:PutLogEvents
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Secrets Manager GetSecretValue権限を付与（Requirements 3.3）
    // PRIVATE_KEYシークレットへの読み取りアクセスを許可
    this.privateKeySecret.grantRead(executionRole);

    // Lambda関数作成
    // コードアセットのパスを解決
    // __dirnameはpkgs/cdk/libを指すため、../../mcp/distで正しいパスになる
    const mcpCodePath = path.resolve(__dirname, '../../mcp/dist');
    
    const mcpServerFunction = new lambda.Function(this, 'McpServerFunction', {
      functionName: 'jpyc-ai-agent-mcp-server',
      description: 'MCP Server for JPYC SDK operations',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      // pkgs/mcp/distディレクトリをコードソースとして指定
      code: lambda.Code.fromAsset(mcpCodePath),
      memorySize: this.context.mcpServerMemory ?? 512,
      timeout: cdk.Duration.seconds(this.context.mcpServerTimeout ?? 60),
      architecture: lambda.Architecture.ARM_64,
      role: executionRole,
      // CloudWatch Logs設定
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: this.context.environment ?? 'production',
        // PRIVATE_KEYはSecrets Managerから取得
        // Lambda実行時にSecrets Manager Extension経由で取得する方法もあるが、
        // ここでは環境変数として参照を設定
        PRIVATE_KEY_SECRET_ARN: this.privateKeySecret.secretArn,
      },
    });

    // Function URL有効化（IAM認証）
    const functionUrl = mcpServerFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedMethods: [lambda.HttpMethod.POST],
        allowedHeaders: ['Content-Type'],
        maxAge: cdk.Duration.seconds(300),
      },
    });

    // Function URLを出力
    new cdk.CfnOutput(this, 'McpServerFunctionUrl', {
      value: functionUrl.url,
      description: 'MCP Server Lambda Function URL',
      exportName: 'JPYCAIAgentMcpServerFunctionUrl',
    });

    return {
      function: mcpServerFunction,
      functionUrl,
    };
  }

  /**
   * Lambda Function (AgentCore) を作成
   * 
   * Mastra AgentをBedrock AgentCore Runtimeで実行するLambda関数を作成します。
   * - Runtime: Node.js 20.x
   * - Memory: 1024 MB（デフォルト、CDK Contextで変更可能）
   * - Timeout: 300秒（デフォルト、CDK Contextで変更可能）
   * - Architecture: arm64 (Graviton2 - コスト効率)
   * - 環境変数: NODE_ENV, JPYC_MCP_SERVER_URL, DYNAMODB_TABLE_NAME, ANTHROPIC_API_KEY
   * 
   * IAM Permissions:
   * - Bedrock InvokeModel: Claude 3.5 Sonnetの呼び出し（Requirements 12.5）
   * - DynamoDB Read/Write: セッションテーブルへの読み書き（Requirements 14.5）
   * - Secrets Manager GetSecretValue: ANTHROPIC_API_KEYの読み取り（Requirements 3.3, 3.6）
   * - Lambda InvokeFunction: MCP Server Lambdaの呼び出し（Requirements 12.4）
   * - CloudWatch Logs: ログ書き込み権限（Requirements 3.6）
   * 
   * @returns AgentCore Lambda Function
   */
  private createAgentCoreFunction(): lambda.Function {
    // Lambda実行ロール作成
    const executionRole = new iam.Role(this, 'AgentCoreExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for JPYC AI Agent AgentCore Lambda',
      managedPolicies: [
        // CloudWatch Logsへの書き込み権限（Requirements 3.6）
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Bedrock InvokeModel権限を付与（Requirements 12.5）
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          // Claude 3.5 Sonnet
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0`,
        ],
      })
    );

    // DynamoDB Read/Write権限を付与（Requirements 14.5）
    this.sessionTable.grantReadWriteData(executionRole);

    // Secrets Manager GetSecretValue権限を付与（Requirements 3.3, 3.6）
    this.anthropicApiKeySecret.grantRead(executionRole);

    // Lambda InvokeFunction権限を付与（MCP Server）（Requirements 12.4）
    this.mcpServerFunction.grantInvoke(executionRole);

    // Lambda関数作成
    // コードアセットのパスを解決
    // 注: AgentCoreのコードは将来的にpkgs/agentcoreに配置される予定
    // 現時点ではプレースホルダーとしてmcpのコードを使用
    const agentCoreCodePath = path.resolve(__dirname, '../../mcp/dist');
    
    const agentCoreFunction = new lambda.Function(this, 'AgentCoreFunction', {
      functionName: 'jpyc-ai-agent-agentcore',
      description: 'Bedrock AgentCore runtime for Mastra Agent',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(agentCoreCodePath),
      memorySize: this.context.agentCoreMemory ?? 1024,
      timeout: cdk.Duration.seconds(this.context.agentCoreTimeout ?? 300),
      architecture: lambda.Architecture.ARM_64,
      role: executionRole,
      // CloudWatch Logs設定
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: this.context.environment ?? 'production',
        // MCP Server Lambda Function URL
        JPYC_MCP_SERVER_URL: this.mcpServerFunctionUrl.url,
        // DynamoDB Session Table Name
        DYNAMODB_TABLE_NAME: this.sessionTable.tableName,
        // ANTHROPIC_API_KEYはSecrets Managerから取得
        ANTHROPIC_API_KEY_SECRET_ARN: this.anthropicApiKeySecret.secretArn,
      },
    });

    return agentCoreFunction;
  }

  /**
   * API Gateway WebSocketを作成
   * 
   * リアルタイム通信用のWebSocket APIを作成します。
   * - Protocol: WebSocket
   * - Routes: $connect, $disconnect, sendMessage, $default
   * - Throttling: 1000 req/s, Burst 2000
   * - Authorization: IAM
   * - CloudWatch Logs: 有効化（7日間保持）
   * 
   * Requirements:
   * - 13.1: WebSocket APIの作成
   * - 13.2: Routes設定
   * - 13.3: Lambda統合
   * - 13.4: スロットリング設定
   * - 13.5: CORS設定（WebSocketではCORSは不要だが、認証設定を含む）
   * 
   * @returns WebSocket APIとStage
   */
  private createWebSocketApi(): {
    api: WebSocketApi;
    stage: WebSocketStage;
  } {
    // CloudWatch Logs用のIAM Role作成
    const apiGatewayLogsRole = new iam.Role(this, 'ApiGatewayLogsRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      description: 'IAM role for API Gateway to write CloudWatch Logs',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
      ],
    });

    // CloudWatch Log Group作成
    const logGroup = new logs.LogGroup(this, 'WebSocketApiLogGroup', {
      logGroupName: '/aws/apigateway/jpyc-ai-agent-websocket',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: this.context.environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // WebSocket API作成
    const webSocketApi = new WebSocketApi(this, 'WebSocketApi', {
      apiName: 'jpyc-ai-agent-websocket',
      description: 'WebSocket API for JPYC AI Agent real-time communication',
      routeSelectionExpression: '$request.body.action',
    });

    // Lambda統合作成
    const integration = new WebSocketLambdaIntegration('AgentCoreIntegration', this.agentCoreFunction);

    // Routes作成
    // $connect: 接続確立時
    webSocketApi.addRoute('$connect', {
      integration,
      authorizer: new WebSocketIamAuthorizer(),
    });

    // $disconnect: 接続切断時
    webSocketApi.addRoute('$disconnect', {
      integration,
      authorizer: new WebSocketIamAuthorizer(),
    });

    // sendMessage: メッセージ送信
    webSocketApi.addRoute('sendMessage', {
      integration,
      authorizer: new WebSocketIamAuthorizer(),
    });

    // $default: デフォルトルート
    webSocketApi.addRoute('$default', {
      integration,
      authorizer: new WebSocketIamAuthorizer(),
    });

    // Stage作成
    const stage = new WebSocketStage(this, 'WebSocketStage', {
      webSocketApi,
      stageName: 'production',
      autoDeploy: true,
      // スロットリング設定（Requirements 13.4）
      throttle: {
        rateLimit: 1000, // 1000 requests/second
        burstLimit: 2000, // 2000 requests burst
      },
    });

    // WebSocket URLを出力
    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: stage.url,
      description: 'WebSocket API URL',
      exportName: 'JPYCAIAgentWebSocketApiUrl',
    });

    new cdk.CfnOutput(this, 'WebSocketApiId', {
      value: webSocketApi.apiId,
      description: 'WebSocket API ID',
      exportName: 'JPYCAIAgentWebSocketApiId',
    });

    return {
      api: webSocketApi,
      stage,
    };
  }
}
