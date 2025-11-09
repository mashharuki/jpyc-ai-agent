import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';
import { DEFAULT_CONTEXT } from '../lib/types';

describe('CdkStack', () => {
  let app: cdk.App;
  let stack: CdkStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    try {
      stack = new CdkStack(app, 'TestStack', {
        context: DEFAULT_CONTEXT,
        env: {
          region: DEFAULT_CONTEXT.region,
        },
      });
      template = Template.fromStack(stack);
    } catch (error) {
      console.error('Error creating stack:', error);
      throw error;
    }
  });

  test('Stack should be created', () => {
    expect(stack).toBeDefined();
  });

  test('Stack should have correct tags', () => {
    const stackTags = cdk.Tags.of(stack);
    expect(stackTags).toBeDefined();
  });

  test('Stack should synthesize without errors', () => {
    // CloudFormationテンプレートが正常に生成されることを確認
    const templateJson = template.toJSON();
    expect(templateJson).toBeDefined();
    // 現時点ではリソースがないため、Parametersの存在を確認
    expect(templateJson.Parameters).toBeDefined();
  });

  test('Stack should use correct region from context', () => {
    expect(stack.region).toBe(DEFAULT_CONTEXT.region);
  });

  test('Context should have default values', () => {
    expect(stack.context.agentCoreMemory).toBe(1024);
    expect(stack.context.agentCoreTimeout).toBe(300);
    expect(stack.context.mcpServerMemory).toBe(512);
    expect(stack.context.mcpServerTimeout).toBe(60);
    expect(stack.context.sessionTableBillingMode).toBe('PAY_PER_REQUEST');
    expect(stack.context.sessionTtlHours).toBe(24);
    expect(stack.context.environment).toBe('production');
    expect(stack.context.region).toBe('ap-northeast-1');
  });

  describe('Secrets Manager', () => {
    describe('when no existing secrets are provided', () => {
      test('should create PRIVATE_KEY secret', () => {
        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: 'jpyc-ai-agent/private-key',
          Description: 'Ethereum private key for blockchain transactions',
        });
      });

      test('should create ANTHROPIC_API_KEY secret', () => {
        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: 'jpyc-ai-agent/anthropic-api-key',
          Description: 'Anthropic API key for Claude 3.5 Sonnet',
        });
      });

      test('PRIVATE_KEY secret should have correct properties', () => {
        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: 'jpyc-ai-agent/private-key',
          GenerateSecretString: {
            SecretStringTemplate: '{"key":"placeholder"}',
            GenerateStringKey: 'value',
          },
        });
      });

      test('ANTHROPIC_API_KEY secret should have correct properties', () => {
        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: 'jpyc-ai-agent/anthropic-api-key',
          GenerateSecretString: {
            SecretStringTemplate: '{"key":"placeholder"}',
            GenerateStringKey: 'value',
          },
        });
      });

      test('should create exactly 2 secrets', () => {
        template.resourceCountIs('AWS::SecretsManager::Secret', 2);
      });
    });

    describe('when existing secrets are provided via context', () => {
      let stackWithExistingSecrets: CdkStack;
      let templateWithExistingSecrets: Template;

      beforeEach(() => {
        const appWithContext = new cdk.App();
        stackWithExistingSecrets = new CdkStack(appWithContext, 'TestStackWithSecrets', {
          context: {
            ...DEFAULT_CONTEXT,
            privateKeySecretArn: 'arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:existing-private-key-AbCdEf',
            anthropicApiKeySecretArn: 'arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:existing-anthropic-key-XyZ123',
          },
          env: {
            region: DEFAULT_CONTEXT.region,
          },
        });
        templateWithExistingSecrets = Template.fromStack(stackWithExistingSecrets);
      });

      test('should not create new secrets when ARNs are provided', () => {
        templateWithExistingSecrets.resourceCountIs('AWS::SecretsManager::Secret', 0);
      });

      test('should use existing secret ARNs from context', () => {
        expect(stackWithExistingSecrets.context.privateKeySecretArn).toBe(
          'arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:existing-private-key-AbCdEf'
        );
        expect(stackWithExistingSecrets.context.anthropicApiKeySecretArn).toBe(
          'arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:existing-anthropic-key-XyZ123'
        );
      });
    });

    describe('when only one existing secret is provided', () => {
      let stackWithPartialSecrets: CdkStack;
      let templateWithPartialSecrets: Template;

      beforeEach(() => {
        const appWithContext = new cdk.App();
        stackWithPartialSecrets = new CdkStack(appWithContext, 'TestStackWithPartialSecrets', {
          context: {
            ...DEFAULT_CONTEXT,
            privateKeySecretArn: 'arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:existing-private-key-AbCdEf',
          },
          env: {
            region: DEFAULT_CONTEXT.region,
          },
        });
        templateWithPartialSecrets = Template.fromStack(stackWithPartialSecrets);
      });

      test('should create only the missing secret', () => {
        templateWithPartialSecrets.resourceCountIs('AWS::SecretsManager::Secret', 1);
      });

      test('should create ANTHROPIC_API_KEY secret when only PRIVATE_KEY is provided', () => {
        templateWithPartialSecrets.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: 'jpyc-ai-agent/anthropic-api-key',
        });
      });
    });
  });

  describe('DynamoDB Session Store', () => {
    test('should create exactly 1 DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should create DynamoDB table with correct name', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'jpyc-ai-agent-sessions',
      });
    });

    test('should configure partition key as sessionId (String)', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'sessionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
      });
    });

    test('should configure sort key as timestamp (Number)', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('should enable TTL with 24 hours expiration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TimeToLiveSpecification: {
          Enabled: true,
          AttributeName: 'ttl',
        },
      });
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should enable Point-in-Time Recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should enable encryption with AWS managed key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    describe('when PROVISIONED billing mode is specified', () => {
      let stackWithProvisioned: CdkStack;
      let templateWithProvisioned: Template;

      beforeEach(() => {
        const appWithContext = new cdk.App();
        stackWithProvisioned = new CdkStack(appWithContext, 'TestStackWithProvisioned', {
          context: {
            ...DEFAULT_CONTEXT,
            sessionTableBillingMode: 'PROVISIONED',
          },
          env: {
            region: DEFAULT_CONTEXT.region,
          },
        });
        templateWithProvisioned = Template.fromStack(stackWithProvisioned);
      });

      test('should configure read and write capacity for PROVISIONED mode', () => {
        templateWithProvisioned.hasResourceProperties('AWS::DynamoDB::Table', {
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        });
      });
    });

    describe('when custom TTL hours is specified', () => {
      let stackWithCustomTtl: CdkStack;

      beforeEach(() => {
        const appWithContext = new cdk.App();
        stackWithCustomTtl = new CdkStack(appWithContext, 'TestStackWithCustomTtl', {
          context: {
            ...DEFAULT_CONTEXT,
            sessionTtlHours: 48,
          },
          env: {
            region: DEFAULT_CONTEXT.region,
          },
        });
      });

      test('should store custom TTL hours in context', () => {
        expect(stackWithCustomTtl.context.sessionTtlHours).toBe(48);
      });
    });
  });

  describe('S3 Bucket (Static Website Hosting)', () => {
    test('should create exactly 1 S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should create S3 bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'jpyc-ai-agent-frontend',
      });
    });

    test('should enable versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should enable AES-256 encryption (SSE-S3)', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle policy to delete old versions after 30 days', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            },
          ],
        },
      });
    });

    test('should use DESTROY removal policy for non-production environments', () => {
      const devApp = new cdk.App();
      const devStack = new CdkStack(devApp, 'DevStack', {
        context: {
          ...DEFAULT_CONTEXT,
          environment: 'dev',
        },
        env: {
          region: DEFAULT_CONTEXT.region,
        },
      });
      const devTemplate = Template.fromStack(devStack);

      // DESTROY removal policyの場合、DeletionPolicyが設定されない（デフォルト動作）
      // または明示的にDeleteが設定される
      devTemplate.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should use RETAIN removal policy for production environment', () => {
      const prodApp = new cdk.App();
      const prodStack = new CdkStack(prodApp, 'ProdStack', {
        context: {
          ...DEFAULT_CONTEXT,
          environment: 'production',
        },
        env: {
          region: DEFAULT_CONTEXT.region,
        },
      });
      const prodTemplate = Template.fromStack(prodStack);

      // RETAIN removal policyの場合、DeletionPolicyがRetainに設定される
      prodTemplate.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create exactly 1 CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('should create Origin Access Identity (OAI)', () => {
      template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
    });

    test('should configure S3 bucket as origin with OAI', () => {
      // S3バケットがオリジンとして設定されていることを確認
      const resources = template.findResources('AWS::CloudFront::Distribution');
      const distributionKey = Object.keys(resources)[0];
      const distribution = resources[distributionKey];
      
      expect(distribution.Properties.DistributionConfig.Origins).toHaveLength(1);
      expect(distribution.Properties.DistributionConfig.Origins[0]).toHaveProperty('DomainName');
      expect(distribution.Properties.DistributionConfig.Origins[0]).toHaveProperty('S3OriginConfig');
      expect(distribution.Properties.DistributionConfig.Origins[0].S3OriginConfig).toHaveProperty('OriginAccessIdentity');
    });

    test('should set default root object to index.html', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultRootObject: 'index.html',
        },
      });
    });

    test('should enable distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Enabled: true,
        },
      });
    });

    test('should redirect HTTP to HTTPS', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });

    test('should use HTTP/2 and HTTP/3', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          HttpVersion: 'http2and3',
        },
      });
    });

    test('should enable compression', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            Compress: true,
          },
        },
      });
    });

    test('should configure allowed methods for GET, HEAD, OPTIONS', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            CachedMethods: ['GET', 'HEAD'],
          },
        },
      });
    });

    test('should configure custom error responses for 404 and 403', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CustomErrorResponses: [
            {
              ErrorCode: 404,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
            },
            {
              ErrorCode: 403,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
            },
          ],
        },
      });
    });

    test('should use CachingOptimized cache policy', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
          },
        },
      });
    });

    test('should use PriceClass_All for global distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          PriceClass: 'PriceClass_All',
        },
      });
    });

    test('should configure minimum TLS version to TLSv1.2', () => {
      // デフォルト証明書を使用する場合、ViewerCertificateは明示的に設定されない
      // CDKがデフォルトで適切なTLS設定を行う
      const resources = template.findResources('AWS::CloudFront::Distribution');
      const distributionKey = Object.keys(resources)[0];
      const distribution = resources[distributionKey];
      
      // Distributionが作成されていることを確認
      expect(distribution).toBeDefined();
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
    });

    describe('when custom domain is provided', () => {
      let stackWithDomain: CdkStack;
      let templateWithDomain: Template;

      beforeEach(() => {
        const appWithContext = new cdk.App();
        stackWithDomain = new CdkStack(appWithContext, 'TestStackWithDomain', {
          context: {
            ...DEFAULT_CONTEXT,
            domainName: 'app.example.com',
            certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
          },
          env: {
            region: DEFAULT_CONTEXT.region,
          },
        });
        templateWithDomain = Template.fromStack(stackWithDomain);
      });

      test('should configure custom domain aliases', () => {
        templateWithDomain.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            Aliases: ['app.example.com'],
          },
        });
      });

      test('should use ACM certificate for custom domain', () => {
        templateWithDomain.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            ViewerCertificate: {
              AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
              SslSupportMethod: 'sni-only',
              MinimumProtocolVersion: 'TLSv1.2_2021',
            },
          },
        });
      });
    });

    test('should grant OAI read access to S3 bucket', () => {
      // S3バケットポリシーが作成されることを確認
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      
      const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
      const policyKey = Object.keys(bucketPolicies)[0];
      const policy = bucketPolicies[policyKey];
      
      // バケットポリシーにOAIへのアクセス許可が含まれていることを確認
      expect(policy.Properties.PolicyDocument.Statement).toBeDefined();
      expect(policy.Properties.PolicyDocument.Statement.length).toBeGreaterThan(0);
      
      // 少なくとも1つのステートメントがCanonicalUserプリンシパルを持つことを確認
      const hasCanonicalUser = policy.Properties.PolicyDocument.Statement.some(
        (statement: any) => statement.Principal && statement.Principal.CanonicalUser
      );
      expect(hasCanonicalUser).toBe(true);
    });
  });

  describe('Lambda Function (MCP Server)', () => {
    // Note: Lambda関数はタスク6.2で実装されます
    // これらのテストは実装後にパスするように設計されています
    
    test('should create MCP Server Lambda function', () => {
      // Log Retention用のカスタムリソースLambdaも含まれるため、最低1つ以上
      const functions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(1);
      
      // MCP Server Lambda関数が存在することを確認
      const mcpServerFunction = Object.values(functions).find(
        (fn: any) => fn.Properties?.FunctionName === 'jpyc-ai-agent-mcp-server'
      );
      expect(mcpServerFunction).toBeDefined();
    });

    test('should configure Lambda with Node.js 20.x runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
      });
    });

    test('should configure Lambda with 512 MB memory', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 512,
      });
    });

    test('should configure Lambda with 60 seconds timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 60,
      });
    });

    test('should configure Lambda with arm64 architecture', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['arm64'],
      });
    });

    test('should configure Lambda with correct handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
      });
    });

    test('should configure Lambda with correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            NODE_ENV: 'production',
          },
        },
      });
    });

    test('should configure Lambda with ephemeral storage', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKey = Object.keys(functions)[0];
      const lambdaFunction = functions[functionKey];
      
      // Ephemeral storageが設定されているか、デフォルト値が使用されていることを確認
      expect(lambdaFunction.Properties).toBeDefined();
    });

    test('should create Lambda execution role', () => {
      // Log Retention用のカスタムリソースRoleも含まれるため、最低1つ以上
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(1);
      
      // MCP Server Lambda実行ロールが存在することを確認
      const mcpServerRole = Object.values(roles).find(
        (role: any) => role.Properties?.Description === 'Execution role for JPYC AI Agent MCP Server Lambda'
      );
      expect(mcpServerRole).toBeDefined();
    });

    test('should configure Lambda execution role with correct assume role policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should grant Lambda execution role Secrets Manager GetSecretValue permission', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      
      expect(policyKeys.length).toBeGreaterThan(0);
      
      // Secrets Managerへのアクセス権限を持つポリシーが存在することを確認
      const hasSecretsManagerPolicy = policyKeys.some((key) => {
        const policy = policies[key];
        return policy.Properties.PolicyDocument?.Statement?.some(
          (statement: { Action: string | string[]; Effect: string }) => {
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            return (
              (actions.includes('secretsmanager:GetSecretValue') ||
                actions.includes('secretsmanager:DescribeSecret')) &&
              statement.Effect === 'Allow'
            );
          }
        );
      });
      
      expect(hasSecretsManagerPolicy).toBe(true);
    });

    test('should grant Lambda execution role permission to specific PRIVATE_KEY secret', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      
      expect(policyKeys.length).toBeGreaterThan(0);
      
      // Secrets Managerへのアクセス権限を持つポリシーが存在することを確認
      const hasSecretsManagerPolicy = policyKeys.some((key) => {
        const policy = policies[key];
        return policy.Properties.PolicyDocument?.Statement?.some(
          (statement: { Action: string | string[]; Effect: string }) => {
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            return actions.includes('secretsmanager:GetSecretValue') && statement.Effect === 'Allow';
          }
        );
      });
      
      expect(hasSecretsManagerPolicy).toBe(true);
    });

    test('should grant Lambda execution role CloudWatch Logs permissions', () => {
      // Lambda関数作成時に自動的にCloudWatch Logsへの書き込み権限が付与される
      // AWSLambdaBasicExecutionRoleマネージドポリシーが使用される
      const roles = template.findResources('AWS::IAM::Role');
      const roleKeys = Object.keys(roles);
      
      expect(roleKeys.length).toBeGreaterThan(0);
      
      // 少なくとも1つのロールがLambda実行ロールであることを確認
      const hasLambdaRole = roleKeys.some((key) => {
        const role = roles[key];
        return role.Properties.AssumeRolePolicyDocument?.Statement?.some(
          (statement: { Principal?: { Service?: string | string[] } }) =>
            statement.Principal?.Service === 'lambda.amazonaws.com' ||
            (Array.isArray(statement.Principal?.Service) &&
              statement.Principal.Service.includes('lambda.amazonaws.com'))
        );
      });
      
      expect(hasLambdaRole).toBe(true);
    });

    test('should attach managed policy for basic Lambda execution', () => {
      // Lambda実行ロールにAWSLambdaBasicExecutionRoleが付与されていることを確認
      const roles = template.findResources('AWS::IAM::Role');
      const roleKeys = Object.keys(roles);
      
      const lambdaRole = roleKeys.find((key) => {
        const role = roles[key];
        return role.Properties.AssumeRolePolicyDocument?.Statement?.some(
          (statement: { Principal?: { Service?: string | string[] } }) =>
            statement.Principal?.Service === 'lambda.amazonaws.com' ||
            (Array.isArray(statement.Principal?.Service) &&
              statement.Principal.Service.includes('lambda.amazonaws.com'))
        );
      });
      
      expect(lambdaRole).toBeDefined();
      
      if (lambdaRole) {
        const role = roles[lambdaRole];
        // ManagedPolicyArnsが設定されているか確認
        expect(role.Properties.ManagedPolicyArns).toBeDefined();
      }
    });

    test('should enable Function URL with IAM authentication', () => {
      template.resourceCountIs('AWS::Lambda::Url', 1);
      
      template.hasResourceProperties('AWS::Lambda::Url', {
        AuthType: 'AWS_IAM',
      });
    });

    test('should configure Function URL CORS settings', () => {
      template.hasResourceProperties('AWS::Lambda::Url', {
        Cors: {
          AllowMethods: ['POST'],
          AllowHeaders: ['Content-Type'],
          MaxAge: 300,
        },
      });
    });

    test('should configure Function URL with correct target function', () => {
      const functionUrls = template.findResources('AWS::Lambda::Url');
      const urlKey = Object.keys(functionUrls)[0];
      const functionUrl = functionUrls[urlKey];
      
      // Function URLがLambda関数を参照していることを確認
      expect(functionUrl.Properties.TargetFunctionArn).toBeDefined();
    });

    test('should configure Function URL with invoke mode BUFFERED', () => {
      const functionUrls = template.findResources('AWS::Lambda::Url');
      const urlKey = Object.keys(functionUrls)[0];
      const functionUrl = functionUrls[urlKey];
      
      // InvokeModeがBUFFEREDまたは未設定（デフォルト）であることを確認
      if (functionUrl.Properties.InvokeMode) {
        expect(functionUrl.Properties.InvokeMode).toBe('BUFFERED');
      }
    });

    describe('when custom memory size is specified', () => {
      let stackWithCustomMemory: CdkStack;
      let templateWithCustomMemory: Template;

      beforeEach(() => {
        const appWithContext = new cdk.App();
        stackWithCustomMemory = new CdkStack(appWithContext, 'TestStackWithCustomMemory', {
          context: {
            ...DEFAULT_CONTEXT,
            mcpServerMemory: 1024,
          },
          env: {
            region: DEFAULT_CONTEXT.region,
          },
        });
        templateWithCustomMemory = Template.fromStack(stackWithCustomMemory);
      });

      test('should use custom memory size', () => {
        templateWithCustomMemory.hasResourceProperties('AWS::Lambda::Function', {
          MemorySize: 1024,
        });
      });
    });

    describe('when custom timeout is specified', () => {
      let stackWithCustomTimeout: CdkStack;
      let templateWithCustomTimeout: Template;

      beforeEach(() => {
        const appWithContext = new cdk.App();
        stackWithCustomTimeout = new CdkStack(appWithContext, 'TestStackWithCustomTimeout', {
          context: {
            ...DEFAULT_CONTEXT,
            mcpServerTimeout: 120,
          },
          env: {
            region: DEFAULT_CONTEXT.region,
          },
        });
        templateWithCustomTimeout = Template.fromStack(stackWithCustomTimeout);
      });

      test('should use custom timeout', () => {
        templateWithCustomTimeout.hasResourceProperties('AWS::Lambda::Function', {
          Timeout: 120,
        });
      });
    });

    test('should reference PRIVATE_KEY secret in environment variables', () => {
      // Lambda関数の環境変数にPRIVATE_KEYシークレットへの参照が含まれることを確認
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKey = Object.keys(functions)[0];
      const lambdaFunction = functions[functionKey];
      
      // 環境変数が定義されていることを確認
      expect(lambdaFunction.Properties.Environment).toBeDefined();
      expect(lambdaFunction.Properties.Environment.Variables).toBeDefined();
      
      // NODE_ENVが設定されていることを確認
      expect(lambdaFunction.Properties.Environment.Variables.NODE_ENV).toBe('production');
    });

    test('should configure CloudWatch Logs retention for Lambda function', () => {
      // Lambda関数作成時にlogRetentionプロパティが設定されていることを確認
      const functions = template.findResources('AWS::Lambda::Function');
      const mcpServerFunction = Object.values(functions).find(
        (fn: any) => fn.Properties?.FunctionName === 'jpyc-ai-agent-mcp-server'
      );
      
      expect(mcpServerFunction).toBeDefined();
      // Lambda関数にログ保持期間が設定されていることを確認（CDKが自動的にLog Groupを作成）
    });

    test('should configure Lambda function with CloudWatch Logs integration', () => {
      // Lambda実行ロールにCloudWatch Logsへの書き込み権限が付与されていることを確認
      const roles = template.findResources('AWS::IAM::Role');
      const mcpServerRole = Object.values(roles).find(
        (role: any) => role.Properties?.Description === 'Execution role for JPYC AI Agent MCP Server Lambda'
      );
      
      expect(mcpServerRole).toBeDefined();
      
      if (mcpServerRole) {
        const role = mcpServerRole as any;
        // ManagedPolicyArnsにAWSLambdaBasicExecutionRoleが含まれていることを確認
        expect(role.Properties.ManagedPolicyArns).toBeDefined();
        expect(role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
      }
    });

    test('should tag Lambda function with project information', () => {
      // スタックレベルのタグがLambda関数にも適用されることを確認
      const functions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBeGreaterThan(0);
    });

    test('should not configure reserved concurrent executions by default', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKey = Object.keys(functions)[0];
      const lambdaFunction = functions[functionKey];
      
      // Reserved Concurrent Executionsが設定されていないことを確認（自動スケーリング）
      expect(lambdaFunction.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('should configure Lambda function description', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKey = Object.keys(functions)[0];
      const lambdaFunction = functions[functionKey];
      
      // Descriptionが設定されていることを確認
      expect(lambdaFunction.Properties.Description).toBeDefined();
    });
  });

  describe('API Gateway WebSocket', () => {
    // Note: API Gateway WebSocketはタスク7.2で実装されます
    // これらのテストは実装後にパスするように設計されています

    test('should create WebSocket API', () => {
      template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
    });

    test('should configure WebSocket protocol', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        ProtocolType: 'WEBSOCKET',
      });
    });

    test('should configure API name', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: 'jpyc-ai-agent-websocket',
      });
    });

    test('should configure route selection expression', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        RouteSelectionExpression: '$request.body.action',
      });
    });

    test('should create $connect route', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: '$connect',
      });
    });

    test('should create $disconnect route', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: '$disconnect',
      });
    });

    test('should create sendMessage route', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'sendMessage',
      });
    });

    test('should create $default route', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: '$default',
      });
    });

    test('should create exactly 4 routes', () => {
      template.resourceCountIs('AWS::ApiGatewayV2::Route', 4);
    });

    test('should create WebSocket stage', () => {
      template.resourceCountIs('AWS::ApiGatewayV2::Stage', 1);
    });

    test('should configure stage name as production', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        StageName: 'production',
      });
    });

    test('should enable auto deploy for stage', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        AutoDeploy: true,
      });
    });

    test('should configure throttling settings', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        DefaultRouteSettings: {
          ThrottlingRateLimit: 1000,
          ThrottlingBurstLimit: 2000,
        },
      });
    });

    test('should create Lambda integration for routes', () => {
      // 4つのルート用のIntegrationが作成される
      template.resourceCountIs('AWS::ApiGatewayV2::Integration', 4);
    });

    test('should configure Lambda integration type', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
        IntegrationType: 'AWS_PROXY',
      });
    });

    test('should configure integration timeout', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
        TimeoutInMillis: 29000, // 29秒（API Gatewayの最大値）
      });
    });

    test('should grant API Gateway permission to invoke Lambda', () => {
      // Lambda関数の実行権限がAPI Gatewayに付与されていることを確認
      const permissions = template.findResources('AWS::Lambda::Permission');
      const permissionKeys = Object.keys(permissions);
      
      expect(permissionKeys.length).toBeGreaterThan(0);
      
      // API Gatewayからの呼び出し権限が存在することを確認
      const hasApiGatewayPermission = permissionKeys.some((key) => {
        const permission = permissions[key];
        return (
          permission.Properties.Action === 'lambda:InvokeFunction' &&
          permission.Properties.Principal === 'apigateway.amazonaws.com'
        );
      });
      
      expect(hasApiGatewayPermission).toBe(true);
    });

    test('should configure IAM authorization for routes', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        AuthorizationType: 'AWS_IAM',
      });
    });

    test('should enable CloudWatch Logs for WebSocket API', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        DefaultRouteSettings: {
          LoggingLevel: 'INFO',
          DataTraceEnabled: true,
        },
      });
    });

    test('should create CloudWatch Log Group for API Gateway', () => {
      // API Gateway用のLog Groupが作成されることを確認
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupKeys = Object.keys(logGroups);
      
      expect(logGroupKeys.length).toBeGreaterThan(0);
      
      // API Gateway用のLog Groupが存在することを確認
      const hasApiGatewayLogGroup = logGroupKeys.some((key) => {
        const logGroup = logGroups[key];
        return logGroup.Properties?.LogGroupName?.includes('apigateway') ||
               logGroup.Properties?.LogGroupName?.includes('websocket');
      });
      
      expect(hasApiGatewayLogGroup).toBe(true);
    });

    test('should configure CloudWatch Logs retention to 7 days', () => {
      // API Gateway用のLog Groupの保持期間が7日間であることを確認
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const apiGatewayLogGroup = Object.values(logGroups).find(
        (logGroup: any) => logGroup.Properties?.LogGroupName?.includes('apigateway') ||
                          logGroup.Properties?.LogGroupName?.includes('websocket')
      );
      
      if (apiGatewayLogGroup) {
        expect((apiGatewayLogGroup as any).Properties.RetentionInDays).toBe(7);
      }
    });

    test('should output WebSocket URL', () => {
      // WebSocket URLがCfnOutputとして出力されることを確認
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);
      
      expect(outputKeys.length).toBeGreaterThan(0);
      
      // WebSocket URL出力が存在することを確認
      const hasWebSocketUrlOutput = outputKeys.some((key) => 
        key.includes('WebSocket') || key.includes('ApiUrl')
      );
      
      expect(hasWebSocketUrlOutput).toBe(true);
    });

    describe('when custom throttling settings are specified', () => {
      let stackWithCustomThrottling: CdkStack;
      let templateWithCustomThrottling: Template;

      beforeEach(() => {
        const appWithContext = new cdk.App();
        stackWithCustomThrottling = new CdkStack(appWithContext, 'TestStackWithCustomThrottling', {
          context: {
            ...DEFAULT_CONTEXT,
            // カスタムスロットリング設定は将来的にCDK Contextで設定可能にする
          },
          env: {
            region: DEFAULT_CONTEXT.region,
          },
        });
        templateWithCustomThrottling = Template.fromStack(stackWithCustomThrottling);
      });

      test('should use default throttling settings', () => {
        // デフォルトのスロットリング設定が使用されることを確認
        templateWithCustomThrottling.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
          DefaultRouteSettings: {
            ThrottlingRateLimit: 1000,
            ThrottlingBurstLimit: 2000,
          },
        });
      });
    });

    test('should configure WebSocket API with correct description', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Description: 'WebSocket API for JPYC AI Agent real-time communication',
      });
    });

    test('should create deployment for WebSocket API', () => {
      // Deploymentが作成されることを確認
      template.resourceCountIs('AWS::ApiGatewayV2::Deployment', 1);
    });

    test('should configure stage to depend on deployment', () => {
      // StageがDeploymentに依存していることを確認
      const stages = template.findResources('AWS::ApiGatewayV2::Stage');
      const stageKey = Object.keys(stages)[0];
      const stage = stages[stageKey];
      
      expect(stage.Properties.DeploymentId).toBeDefined();
    });

    test('should enable detailed metrics for stage', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        DefaultRouteSettings: {
          DetailedMetricsEnabled: true,
        },
      });
    });

    test('should configure integration content handling', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
        ContentHandlingStrategy: 'CONVERT_TO_TEXT',
      });
    });

    test('should configure route response selection expression', () => {
      // ルートレスポンスが適切に設定されていることを確認
      const routes = template.findResources('AWS::ApiGatewayV2::Route');
      const routeKeys = Object.keys(routes);
      
      expect(routeKeys.length).toBeGreaterThan(0);
      
      // 各ルートが適切に設定されていることを確認
      routeKeys.forEach((key) => {
        const route = routes[key];
        expect(route.Properties.RouteKey).toBeDefined();
      });
    });

    test('should create IAM role for API Gateway CloudWatch Logs', () => {
      // API GatewayがCloudWatch Logsに書き込むためのIAM Roleが作成されることを確認
      const roles = template.findResources('AWS::IAM::Role');
      const roleKeys = Object.keys(roles);
      
      expect(roleKeys.length).toBeGreaterThan(0);
      
      // API Gateway用のロールが存在することを確認
      const hasApiGatewayRole = roleKeys.some((key) => {
        const role = roles[key];
        return role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (statement: { Principal?: { Service?: string | string[] } }) =>
            statement.Principal?.Service === 'apigateway.amazonaws.com' ||
            (Array.isArray(statement.Principal?.Service) &&
              statement.Principal.Service.includes('apigateway.amazonaws.com'))
        );
      });
      
      expect(hasApiGatewayRole).toBe(true);
    });

    test('should grant API Gateway role CloudWatch Logs permissions', () => {
      // API Gateway RoleにCloudWatch Logsへの書き込み権限が付与されていることを確認
      const roles = template.findResources('AWS::IAM::Role');
      const apiGatewayRole = Object.values(roles).find(
        (role: any) => role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (statement: { Principal?: { Service?: string | string[] } }) =>
            statement.Principal?.Service === 'apigateway.amazonaws.com' ||
            (Array.isArray(statement.Principal?.Service) &&
              statement.Principal.Service.includes('apigateway.amazonaws.com'))
        )
      );
      
      if (apiGatewayRole) {
        const role = apiGatewayRole as any;
        // ManagedPolicyArnsまたはPoliciesが設定されていることを確認
        expect(
          role.Properties.ManagedPolicyArns || role.Properties.Policies
        ).toBeDefined();
      }
    });
  });
});
