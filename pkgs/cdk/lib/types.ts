/**
 * CDK Context型定義
 * 
 * cdk.jsonまたはコマンドライン引数で指定可能な設定値
 */
export interface CDKContext {
  // S3 & CloudFront
  /**
   * カスタムドメイン名（オプション）
   * 例: "app.example.com"
   */
  domainName?: string;

  /**
   * ACM証明書ARN（オプション）
   * カスタムドメインを使用する場合に必要
   */
  certificateArn?: string;

  // Lambda Configuration
  /**
   * AgentCore Lambdaのメモリサイズ（MB）
   * @default 1024
   */
  agentCoreMemory?: number;

  /**
   * AgentCore Lambdaのタイムアウト（秒）
   * @default 300
   */
  agentCoreTimeout?: number;

  /**
   * MCP Server Lambdaのメモリサイズ（MB）
   * @default 512
   */
  mcpServerMemory?: number;

  /**
   * MCP Server Lambdaのタイムアウト（秒）
   * @default 60
   */
  mcpServerTimeout?: number;

  // Secrets
  /**
   * 既存のPRIVATE_KEYシークレットARN（オプション）
   * 指定しない場合は新規作成
   */
  privateKeySecretArn?: string;

  /**
   * 既存のANTHROPIC_API_KEYシークレットARN（オプション）
   * 指定しない場合は新規作成
   */
  anthropicApiKeySecretArn?: string;

  // DynamoDB
  /**
   * DynamoDBテーブルの課金モード
   * @default 'PAY_PER_REQUEST'
   */
  sessionTableBillingMode?: 'PAY_PER_REQUEST' | 'PROVISIONED';

  /**
   * セッションのTTL（時間）
   * @default 24
   */
  sessionTtlHours?: number;

  // Deployment
  /**
   * デプロイ環境
   * @default 'production'
   */
  environment?: 'dev' | 'staging' | 'production';

  /**
   * AWSリージョン
   * @default 'ap-northeast-1'
   */
  region?: string;
}

/**
 * CDK Contextのデフォルト値
 */
export const DEFAULT_CONTEXT: Required<Omit<CDKContext, 'domainName' | 'certificateArn' | 'privateKeySecretArn' | 'anthropicApiKeySecretArn'>> = {
  agentCoreMemory: 1024,
  agentCoreTimeout: 300,
  mcpServerMemory: 512,
  mcpServerTimeout: 60,
  sessionTableBillingMode: 'PAY_PER_REQUEST',
  sessionTtlHours: 24,
  environment: 'production',
  region: 'ap-northeast-1',
};

/**
 * CDK Contextを取得し、デフォルト値とマージする
 */
export function getContext(app: any): CDKContext {
  const context: CDKContext = {
    domainName: app.node.tryGetContext('domainName'),
    certificateArn: app.node.tryGetContext('certificateArn'),
    agentCoreMemory: app.node.tryGetContext('agentCoreMemory') ?? DEFAULT_CONTEXT.agentCoreMemory,
    agentCoreTimeout: app.node.tryGetContext('agentCoreTimeout') ?? DEFAULT_CONTEXT.agentCoreTimeout,
    mcpServerMemory: app.node.tryGetContext('mcpServerMemory') ?? DEFAULT_CONTEXT.mcpServerMemory,
    mcpServerTimeout: app.node.tryGetContext('mcpServerTimeout') ?? DEFAULT_CONTEXT.mcpServerTimeout,
    privateKeySecretArn: app.node.tryGetContext('privateKeySecretArn'),
    anthropicApiKeySecretArn: app.node.tryGetContext('anthropicApiKeySecretArn'),
    sessionTableBillingMode: app.node.tryGetContext('sessionTableBillingMode') ?? DEFAULT_CONTEXT.sessionTableBillingMode,
    sessionTtlHours: app.node.tryGetContext('sessionTtlHours') ?? DEFAULT_CONTEXT.sessionTtlHours,
    environment: app.node.tryGetContext('environment') ?? DEFAULT_CONTEXT.environment,
    region: app.node.tryGetContext('region') ?? DEFAULT_CONTEXT.region,
  };

  return context;
}
