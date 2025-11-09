# Implementation Plan

## Overview
このタスクリストは、JPYC AI AgentアプリケーションをAWS上に完全サーバーレス構成でデプロイするためのCDKインフラストラクチャを実装します。TDD（テスト駆動開発）の原則に従い、各タスクでテストを先に書いてから実装を行います。

## Task List

- [x] 1. プロジェクトセットアップとCDK初期化
  - CDKプロジェクトの初期化とディレクトリ構造の作成
  - 必要な依存関係のインストール
  - _Requirements: 8.1, 8.2, 10.1_

- [x] 1.1 CDKプロジェクトの初期化
  - `pkgs/cdk`ディレクトリを作成
  - `cdk init app --language typescript`を実行
  - package.jsonにCDK依存関係を追加
  - _Requirements: 8.1, 8.2_

- [x] 1.2 必要なCDKライブラリのインストール
  - @aws-cdk/aws-s3
  - @aws-cdk/aws-cloudfront
  - @aws-cdk/aws-lambda
  - @aws-cdk/aws-apigatewayv2
  - @aws-cdk/aws-dynamodb
  - @aws-cdk/aws-secretsmanager
  - その他必要なライブラリ
  - _Requirements: 8.1_

- [x] 1.3 CDKスタック基本構造の作成
  - メインスタッククラスの作成
  - CDK Contextの型定義
  - _Requirements: 8.2, 8.3_

- [x] 1.4 CDKスタックのユニットテスト環境セットアップ
  - Jestの設定
  - AWS CDK Assertionsのインストール
  - テストファイルの雛形作成
  - _Requirements: 8.5_

- [x] 2. Secrets Manager構築
  - API KeysとPrivate Keyを管理するSecrets Managerリソースの作成
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2.1 Secrets Managerのユニットテスト作成
  - シークレットが正しく作成されることを検証
  - シークレット名とプロパティの検証
  - _Requirements: 3.1, 3.2, 8.5_

- [x] 2.2 Secrets Managerリソースの実装
  - PRIVATE_KEYシークレットの作成
  - ANTHROPIC_API_KEYシークレットの作成
  - 既存シークレットのインポート対応（CDK Context経由）
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3. DynamoDB Session Store構築
  - セッション管理用DynamoDBテーブルの作成
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 3.1 DynamoDBテーブルのユニットテスト作成
  - テーブルが正しく作成されることを検証
  - Partition Key、Sort Key、TTL設定の検証
  - Billing Modeの検証
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 8.5_

- [x] 3.2 DynamoDBテーブルの実装
  - テーブル名: jpyc-ai-agent-sessions
  - Partition Key: sessionId (String)
  - Sort Key: timestamp (Number)
  - TTL属性: ttl (24時間)
  - Billing Mode: PAY_PER_REQUEST
  - Point-in-Time Recovery有効化
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 4. S3 Bucket構築（Static Website Hosting）
  - Next.js Static ExportをホスティングするS3バケットの作成
  - _Requirements: 1.1, 1.2, 4.1_

- [x] 4.1 S3 Bucketのユニットテスト作成
  - バケットが正しく作成されることを検証
  - バージョニング、暗号化、パブリックアクセスブロックの検証
  - _Requirements: 4.1, 8.5_

- [x] 4.2 S3 Bucketの実装
  - バケット名: jpyc-ai-agent-frontend
  - バージョニング有効化
  - 暗号化: AES-256 (SSE-S3)
  - パブリックアクセスブロック
  - Lifecycle Policy（古いバージョン削除）
  - _Requirements: 4.1, 4.2_

- [x] 5. CloudFront Distribution構築
  - S3バケットをオリジンとするCloudFront Distributionの作成
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 5.1 CloudFront Distributionのユニットテスト作成
  - Distributionが正しく作成されることを検証
  - OAI、キャッシュポリシー、エラーレスポンスの検証
  - _Requirements: 1.3, 1.4, 8.5_

- [x] 5.2 CloudFront Distributionの実装
  - Origin: S3 Bucket (OAI経由)
  - Default Root Object: index.html
  - HTTP → HTTPS リダイレクト
  - Custom Error Responses (404, 403 → /index.html)
  - Cache Behavior設定
  - _Requirements: 1.3, 1.4_

- [x] 6. Lambda Function（MCP Server）構築
  - JPYC SDK操作を行うMCP Server Lambda関数の作成
  - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.2_

- [x] 6.1 MCP Server Lambdaのユニットテスト作成
  - Lambda関数が正しく作成されることを検証
  - Runtime、Memory、Timeout、Architectureの検証
  - IAM Roleとポリシーの検証
  - Function URL設定の検証
  - _Requirements: 2.1, 2.2, 12.1, 12.2, 8.5_

- [x] 6.2 MCP Server Lambdaの実装
  - Runtime: Node.js 20.x
  - Memory: 512 MB
  - Timeout: 60秒
  - Architecture: arm64
  - Function URL有効化（IAM認証）
  - 環境変数: NODE_ENV, PRIVATE_KEY (Secrets Manager)
  - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.2, 12.3_

- [x] 6.3 MCP Server Lambda IAM Roleの実装
  - Secrets Manager GetSecretValue権限
  - CloudWatch Logs書き込み権限
  - _Requirements: 3.3, 3.6_

- [ ] 7. API Gateway WebSocket構築
  - リアルタイム通信用API Gateway WebSocketの作成
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 7.1 API Gateway WebSocketのユニットテスト作成
  - API Gatewayが正しく作成されることを検証
  - Routes、Integration、Throttlingの検証
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 8.5_

- [-] 7.2 API Gateway WebSocketの実装
  - Protocol: WebSocket
  - Routes: $connect, $disconnect, sendMessage, $default
  - Throttling: 1000 req/s, Burst 2000
  - Authorization: IAM
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 8. Lambda Function（Bedrock AgentCore）構築
  - Mastra AgentをBedrock AgentCore Runtimeで実行するLambda関数の作成
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 8.1 AgentCore Lambdaのユニットテスト作成
  - Lambda関数が正しく作成されることを検証
  - Runtime、Memory、Timeout、Architectureの検証
  - IAM Roleとポリシーの検証
  - 環境変数の検証
  - _Requirements: 12.1, 12.2, 12.3, 8.5_

- [ ] 8.2 AgentCore Lambdaの実装
  - Runtime: Node.js 20.x
  - Memory: 1024 MB
  - Timeout: 300秒
  - Architecture: arm64
  - 環境変数: NODE_ENV, JPYC_MCP_SERVER_URL, DYNAMODB_TABLE_NAME, ANTHROPIC_API_KEY
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 8.3 AgentCore Lambda IAM Roleの実装
  - Bedrock InvokeModel権限
  - DynamoDB Read/Write権限
  - Secrets Manager GetSecretValue権限
  - Lambda InvokeFunction権限（MCP Server）
  - CloudWatch Logs書き込み権限
  - _Requirements: 3.3, 3.5, 3.6, 14.5_

- [ ] 8.4 API Gateway WebSocketとAgentCore Lambdaの統合
  - WebSocket RoutesとLambda関数の接続
  - Integration設定
  - _Requirements: 13.2, 13.3_

- [ ] 9. CloudWatch Logs構築
  - Lambda関数とAPI Gatewayのログ管理
  - _Requirements: 6.1, 6.2, 6.3, 15.4, 15.5_

- [ ] 9.1 CloudWatch Logsのユニットテスト作成
  - Log Groupsが正しく作成されることを検証
  - Retention期間の検証
  - _Requirements: 6.1, 6.2, 15.5, 8.5_

- [ ] 9.2 CloudWatch Log Groupsの実装
  - /aws/lambda/jpyc-ai-agent-agentcore (7日間保持)
  - /aws/lambda/jpyc-ai-agent-mcp-server (7日間保持)
  - /aws/apigateway/jpyc-ai-agent-websocket (7日間保持)
  - _Requirements: 6.1, 6.2, 6.3, 15.5_

- [ ] 10. CloudWatch Alarms構築
  - Lambda関数とCloudFrontの監視アラーム設定
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 10.1 CloudWatch Alarmsのユニットテスト作成
  - Alarmsが正しく作成されることを検証
  - Metric、Threshold、Evaluation Periodsの検証
  - _Requirements: 15.1, 15.2, 15.3, 8.5_

- [ ] 10.2 CloudWatch Alarmsの実装
  - AgentCore Lambda: Error Rate, Duration, Throttles
  - MCP Server Lambda: Error Rate, Duration
  - CloudFront: 4xx Error Rate, 5xx Error Rate
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 11. CDK Deployment Scripts作成
  - package.jsonにデプロイスクリプトを追加
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11.1 package.jsonスクリプトの追加
  - cdk:synth: CloudFormationテンプレート生成
  - cdk:diff: 変更差分確認
  - cdk:deploy: デプロイ実行
  - cdk:destroy: リソース削除
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11.2 デプロイ前チェックスクリプトの作成
  - Secrets Managerのシークレット存在確認
  - AWS認証情報の確認
  - _Requirements: 3.1, 3.2_

- [ ] 12. Next.js Static Export設定
  - Next.jsをStatic Exportモードに設定
  - _Requirements: 1.1, 1.2, 7.1_

- [ ] 12.1 next.config.jsの更新
  - output: 'export'の追加
  - 環境変数の設定（NEXT_PUBLIC_AGENT_API_URL）
  - _Requirements: 1.1, 7.1_

- [ ] 12.2 ビルドスクリプトの作成
  - Next.js Static Exportのビルド
  - S3へのアップロードスクリプト
  - CloudFront Invalidationスクリプト
  - _Requirements: 1.1, 1.2_

- [ ] 13. Lambda関数コードの実装
  - AgentCore LambdaとMCP Server Lambdaのコード実装
  - _Requirements: 2.1, 2.2, 12.1, 12.2, 12.5_

- [ ] 13.1 MCP Server Lambda関数コードの実装
  - JPYC SDK統合
  - MCP Toolsの実装（balance, transfer, totalSupply, switchChain）
  - エラーハンドリング
  - _Requirements: 2.1, 2.2_

- [ ] 13.2 AgentCore Lambda関数コードの実装
  - Bedrock AgentCore Runtimeの統合
  - Mastra Agentの設定
  - MCP Client統合
  - DynamoDBセッション管理
  - ストリーミングレスポンス実装
  - _Requirements: 12.1, 12.2, 12.5, 14.5_

- [ ] 13.3 Lambda関数の統合テスト作成
  - MCP Server Lambdaの動作確認
  - AgentCore Lambdaの動作確認
  - WebSocket経由の通信テスト
  - _Requirements: 2.1, 12.1_

- [ ] 14. エンドツーエンドテスト
  - デプロイされたインフラストラクチャの動作確認
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 12.1, 13.1_

- [ ] 14.1 デプロイ後の動作確認スクリプト作成
  - CloudFront URLへのアクセステスト
  - WebSocket接続テスト
  - チャット機能テスト
  - _Requirements: 1.1, 13.1_

- [ ] 14.2 E2Eテストの実装（Playwright）
  - フロントエンドへのアクセス
  - WebSocket接続確立
  - JPYC残高照会
  - JPYC送金（テストネット）
  - チェーン切り替え
  - セッション永続化
  - _Requirements: 1.1, 2.1, 12.1, 13.1, 14.1_

- [ ] 15. ドキュメント作成
  - デプロイ手順書とトラブルシューティングガイドの作成
  - _Requirements: 8.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15.1 README.mdの作成
  - プロジェクト概要
  - 前提条件
  - デプロイ手順
  - 環境変数の設定方法
  - _Requirements: 8.5_

- [ ] 15.2 トラブルシューティングガイドの作成
  - よくあるエラーと解決方法
  - ログの確認方法
  - ロールバック手順
  - _Requirements: 8.5_

## Notes

- すべてのタスクは、requirements.mdとdesign.mdに基づいて実装されます
- TDD（テスト駆動開発）の原則に従い、すべてのテストタスクを必須としています
- 各タスクは前のタスクに依存する場合があるため、順番に実行してください
- CDK Contextを使用して、環境ごとの設定を柔軟に変更できるようにします
- テストを先に書いてから実装することで、品質と保守性を確保します
