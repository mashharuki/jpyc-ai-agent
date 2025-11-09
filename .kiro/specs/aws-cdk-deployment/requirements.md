# Requirements Document

## Introduction

このドキュメントは、JPYC AI AgentアプリケーションをAWS上にデプロイするためのCDKインフラストラクチャの要件を定義します。現在Next.js + Mastra + MCPで構築されているアプリケーションを、スケーラブルで保守性の高い方法でAWSにデプロイします。

## Glossary

- **System**: JPYC AI Agent CDK Stack - AWS CDKで定義されるインフラストラクチャコード
- **Frontend Application**: Next.js 15 + React 19 + Mastraで構築されたWebアプリケーション
- **MCP Server**: Model Context Protocol準拠のJPYC SDK操作サーバー（HTTP/SSE、ポート3001）
- **Mastra Agent**: Claude 3.5 Sonnetを使用したAIエージェント
- **Bedrock AgentCore**: AWS Bedrock AgentCore - Lambda関数としてMastra Agentを実行するランタイム
- **Lambda Function**: AWS Lambda - サーバーレス関数実行環境
- **API Gateway**: Amazon API Gateway - WebSocket APIエンドポイント
- **DynamoDB**: Amazon DynamoDB - NoSQLデータベース（セッション管理用）
- **ECS**: Amazon Elastic Container Service - コンテナオーケストレーションサービス
- **Fargate**: サーバーレスコンテナ実行環境
- **ALB**: Application Load Balancer - レイヤー7ロードバランサー
- **ECR**: Elastic Container Registry - Dockerイメージレジストリ
- **VPC**: Virtual Private Cloud - 仮想ネットワーク環境
- **Secrets Manager**: AWS Secrets Manager - 機密情報管理サービス
- **CloudWatch**: AWS CloudWatch - ログとメトリクス監視サービス
- **CDK**: AWS Cloud Development Kit - インフラストラクチャをコードで定義するフレームワーク

## Requirements

### Requirement 1

**User Story:** インフラストラクチャエンジニアとして、Next.jsフロントエンドをAWS上にデプロイしたい。これにより、ユーザーがWebブラウザからAPI Gateway経由でMastra Agentと対話できるようになる。

#### Acceptance Criteria

1. THE System SHALL create an ECS Fargate service for the Frontend Application
2. THE System SHALL configure the Frontend Application container with port 3000 exposed
3. THE System SHALL create an Application Load Balancer to route HTTP traffic to the Frontend Application
4. THE System SHALL configure health check endpoint at "/" for the Frontend Application
5. WHERE the Frontend Application is deployed, THE System SHALL enable auto-scaling based on CPU utilization between 1 and 5 tasks

### Requirement 2

**User Story:** インフラストラクチャエンジニアとして、MCP ServerをAWS上にデプロイしたい。これにより、Mastra Agentからブロックチェーン操作を安全に実行できるようになる。

#### Acceptance Criteria

1. THE System SHALL create an ECS Fargate service for the MCP Server
2. THE System SHALL configure the MCP Server container with port 3001 exposed
3. THE System SHALL configure health check endpoint at "/health" for the MCP Server
4. THE System SHALL deploy MCP Server in private subnets for security
5. WHERE the MCP Server is deployed, THE System SHALL configure minimum task count to 1

### Requirement 3

**User Story:** セキュリティエンジニアとして、機密情報を安全に管理したい。これにより、秘密鍵やAPIキーが漏洩するリスクを最小化できる。

#### Acceptance Criteria

1. THE System SHALL store PRIVATE_KEY in AWS Secrets Manager
2. THE System SHALL store ANTHROPIC_API_KEY in AWS Secrets Manager
3. THE System SHALL grant Lambda execution role permission to read secrets from Secrets Manager
4. THE System SHALL grant ECS task execution role permission to read secrets from Secrets Manager
5. THE System SHALL inject PRIVATE_KEY as environment variable into MCP Server container at runtime
6. THE System SHALL inject ANTHROPIC_API_KEY as environment variable into Lambda Function at runtime

### Requirement 4

**User Story:** 開発者として、コンテナイメージを管理したい。これにより、アプリケーションのバージョン管理とデプロイが容易になる。

#### Acceptance Criteria

1. THE System SHALL create an ECR repository for the Frontend Application
2. THE System SHALL create an ECR repository for the MCP Server
3. THE System SHALL configure ECR repositories with image tag immutability enabled
4. THE System SHALL configure ECR repositories with scan on push enabled for vulnerability detection
5. THE System SHALL retain the latest 10 images in each ECR repository

### Requirement 5

**User Story:** ネットワークエンジニアとして、セキュアなネットワーク環境を構築したい。これにより、不正アクセスを防ぎ、必要な通信のみを許可できる。

#### Acceptance Criteria

1. THE System SHALL create a VPC with public and private subnets across 2 availability zones
2. THE System SHALL deploy MCP Server ECS tasks in private subnets
3. THE System SHALL deploy Frontend Application ECS tasks in private subnets
4. THE System SHALL deploy Application Load Balancer in public subnets
5. THE System SHALL configure security groups to allow traffic from Frontend Application to MCP Server on port 3001

### Requirement 6

**User Story:** 運用エンジニアとして、アプリケーションのログとメトリクスを監視したい。これにより、問題を早期に発見し、トラブルシューティングを効率化できる。

#### Acceptance Criteria

1. THE System SHALL create CloudWatch Log Groups for Frontend Application with 7 days retention
2. THE System SHALL create CloudWatch Log Groups for MCP Server with 7 days retention
3. THE System SHALL configure ECS tasks to send logs to CloudWatch Logs
4. THE System SHALL create CloudWatch alarms for high CPU utilization above 80 percent
5. THE System SHALL create CloudWatch alarms for unhealthy target count greater than 0

### Requirement 7

**User Story:** 開発者として、環境変数を適切に設定したい。これにより、アプリケーションが正しく動作し、各サービス間で通信できる。

#### Acceptance Criteria

1. THE System SHALL configure NEXT_PUBLIC_AGENT_API_URL environment variable in Frontend Application pointing to API Gateway WebSocket URL
2. THE System SHALL configure JPYC_MCP_SERVER_URL environment variable in Lambda Function pointing to MCP Server internal endpoint
3. THE System SHALL configure NODE_ENV environment variable as "production" in Frontend, Lambda, and MCP Server
4. THE System SHALL configure PRIVATE_KEY environment variable in MCP Server from Secrets Manager
5. THE System SHALL configure ANTHROPIC_API_KEY environment variable in Lambda Function from Secrets Manager
6. THE System SHALL configure DYNAMODB_TABLE_NAME environment variable in Lambda Function
7. WHERE additional environment variables are required, THE System SHALL support adding them through CDK context or parameters

### Requirement 8

**User Story:** DevOpsエンジニアとして、インフラストラクチャをコードで管理したい。これにより、変更履歴を追跡し、再現可能なデプロイを実現できる。

#### Acceptance Criteria

1. THE System SHALL define all infrastructure resources using AWS CDK TypeScript
2. THE System SHALL organize CDK constructs into logical modules for VPC, ECS, Load Balancers, and Security
3. THE System SHALL use CDK best practices including proper naming conventions and tagging
4. THE System SHALL generate CloudFormation templates that can be deployed to any AWS region
5. THE System SHALL include comprehensive inline documentation for all CDK constructs

### Requirement 9

**User Story:** 開発者として、コスト効率の良いインフラストラクチャを構築したい。これにより、学習用アプリケーションとして適切なコストで運用できる。

#### Acceptance Criteria

1. THE System SHALL use Lambda for Mastra Agent execution to reduce costs compared to always-on ECS tasks
2. THE System SHALL configure DynamoDB with PAY_PER_REQUEST billing mode for cost efficiency
3. THE System SHALL use Fargate Spot instances where appropriate to reduce costs
4. THE System SHALL configure minimum task counts to 1 for both Frontend and MCP Server
5. THE System SHALL use appropriate Fargate task sizes with 0.5 vCPU and 1GB memory for both Frontend and MCP Server
6. THE System SHALL enable CloudWatch Logs retention policies to avoid indefinite storage costs
7. THE System SHALL configure DynamoDB TTL to automatically delete old sessions after 24 hours

### Requirement 10

**User Story:** 開発者として、デプロイプロセスを自動化したい。これにより、手動作業を減らし、デプロイの信頼性を向上させる。

#### Acceptance Criteria

1. THE System SHALL provide CDK deployment scripts in package.json
2. THE System SHALL support "cdk synth" command to generate CloudFormation templates
3. THE System SHALL support "cdk deploy" command to deploy infrastructure to AWS
4. THE System SHALL support "cdk diff" command to preview infrastructure changes
5. THE System SHALL support "cdk destroy" command to clean up all resources

### Requirement 11

**User Story:** 開発者として、Service Discoveryを使ってMCP Serverへの接続を簡素化したい。これにより、Lambda関数からMCP Serverへの接続が容易になる。

#### Acceptance Criteria

1. THE System SHALL create an AWS Cloud Map namespace for service discovery
2. THE System SHALL register MCP Server in Cloud Map with service name "jpyc-mcp-server"
3. THE System SHALL configure Lambda Function to resolve MCP Server endpoint via Cloud Map
4. THE System SHALL enable DNS-based service discovery for internal communication
5. THE System SHALL configure health checks for service discovery to ensure only healthy instances are returned

### Requirement 12

**User Story:** 開発者として、Bedrock AgentCoreを使ってMastra AgentをLambda関数として実行したい。これにより、サーバーレスでスケーラブルなAI処理を実現できる。

#### Acceptance Criteria

1. THE System SHALL create a Lambda Function for Bedrock AgentCore runtime
2. THE System SHALL configure Lambda Function with Node.js 20.x runtime
3. THE System SHALL configure Lambda Function with 1024 MB memory and 300 seconds timeout
4. THE System SHALL deploy Lambda Function in private subnets for MCP Server access
5. THE System SHALL configure Lambda Function to invoke Claude 3.5 Sonnet via Bedrock

### Requirement 13

**User Story:** 開発者として、API Gateway WebSocketを使ってリアルタイム通信を実現したい。これにより、ストリーミングレスポンスをフロントエンドに返却できる。

#### Acceptance Criteria

1. THE System SHALL create an API Gateway WebSocket API
2. THE System SHALL configure WebSocket routes for connect, disconnect, and sendMessage
3. THE System SHALL integrate WebSocket API with Lambda Function
4. THE System SHALL configure throttling with 1000 requests per second rate limit
5. THE System SHALL enable CORS for WebSocket API

### Requirement 14

**User Story:** 開発者として、DynamoDBを使ってセッション情報を永続化したい。これにより、会話履歴を保持し、ユーザー体験を向上させる。

#### Acceptance Criteria

1. THE System SHALL create a DynamoDB table for session storage
2. THE System SHALL configure DynamoDB table with sessionId as partition key and timestamp as sort key
3. THE System SHALL enable TTL on DynamoDB table with 24 hours expiration
4. THE System SHALL configure DynamoDB table with PAY_PER_REQUEST billing mode
5. THE System SHALL grant Lambda Function read and write permissions to DynamoDB table

### Requirement 15

**User Story:** 開発者として、Lambda関数のパフォーマンスとエラーを監視したい。これにより、問題を早期に発見し、システムの信頼性を向上させる。

#### Acceptance Criteria

1. THE System SHALL create CloudWatch alarms for Lambda error rate above 10 errors per 5 minutes
2. THE System SHALL create CloudWatch alarms for Lambda duration above 240 seconds
3. THE System SHALL create CloudWatch alarms for Lambda throttles greater than 0
4. THE System SHALL configure Lambda Function to send logs to CloudWatch Logs
5. THE System SHALL configure CloudWatch Logs retention to 7 days for Lambda Function
