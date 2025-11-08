# アーキテクチャとデザインパターン

## アーキテクチャ概要

### レイヤー構成（MCP統合版）
```
┌──────────────────────────────────────────┐
│  UI Layer (React Components)            │ ← pkgs/frontend/src/components/ChatInterface.tsx
├──────────────────────────────────────────┤
│  API Layer (Next.js Routes)             │ ← pkgs/frontend/src/app/api/*
├──────────────────────────────────────────┤
│  Agent Layer (Mastra)                   │ ← pkgs/frontend/src/lib/mastra/agent.ts
├──────────────────────────────────────────┤
│  MCP Client Layer                       │ ← pkgs/frontend/src/lib/mastra/mcp/client.ts
├──────────────────────────────────────────┤  HTTP/SSE
│  MCP Server Layer                       │ ← pkgs/mcp/src/index.ts
├──────────────────────────────────────────┤
│  Tool Layer (MCP Tools)                 │ ← pkgs/mcp/src/tools.ts
├──────────────────────────────────────────┤
│  SDK Layer (JPYC SDK Core Wrapper)      │ ← pkgs/mcp/src/jpyc/sdk.ts
├──────────────────────────────────────────┤
│  Blockchain Layer (viem + RPC)          │ ← Sepolia / Fuji / Amoy
└──────────────────────────────────────────┘
```

### プロセス分離
- **Next.jsプロセス**: Webアプリケーション（ポート3000）
- **MCPサーバープロセス**: ブロックチェーン操作（ポート3001）

## デザインパターン

### 1. シングルトンパターン（JPYC SDK管理）
`pkgs/mcp/src/jpyc/sdk.ts` でグローバル状態を管理:
- `_jpycInstance`: JPYC SDKインスタンス
- `_currentChain`: 現在のチェーン（デフォルトはsepolia）
- `_account`: 署名用アカウント（PrivateKeyAccount）

利点:
- アプリケーション全体で1つのSDKインスタンスを共有
- チェーン切り替え時の状態一貫性を保証
- MCPサーバー内でステートフル管理

### 2. ファクトリーパターン（クライアント生成）
`createJpycInstance()` 関数でチェーン別にSDKクライアントを生成
- RPC URLとチェーンIDを `CHAIN_ID_MAP` / `RPC_URLS` から解決
- `SdkClient` を構成してJPYCインスタンスを生成

### 3. MCPツールパターン
各ブロックチェーン操作を独立したMCPツールとして定義:
- `jpyc_balance`: 残高照会
- `jpyc_transfer`: 送金
- `jpyc_switch_chain`: チェーン切り替え
- `jpyc_get_current_chain`: 現在のチェーン取得
- `jpyc_total_supply`: 総供給量照会

利点:
- 各機能が独立してテスト・保守可能
- 新しいツール追加が容易
- LLMから直接呼び出し可能

### 4. プロトコル抽象化（MCP）
Model Context Protocolによるツール抽象化:
- ツール定義とLLMの疎結合
- HTTP/SSE経由の通信
- スキーマベースのバリデーション

### 5. レイヤードアーキテクチャ
各レイヤーが明確に分離:
- UI層: ユーザーインターフェース
- API層: HTTPエンドポイント
- エージェント層: AI意思決定
- MCP層: プロトコル変換
- ツール層: ブロックチェーン操作
- SDK層: 低レベルAPI

### 6. ストレージ抽象化
`pkgs/frontend/src/lib/storage/` でローカルストレージを抽象化:
- 型安全なストレージ操作
- プロフィール・友達管理
- 将来的なストレージ実装変更に対応しやすい

## 主要な技術選択

### Mastra + MCP
- **Mastra 0.23.3**: エージェントフレームワーク
  - Claude / GPT-4o-mini / Gemini への切り替えをサポート
  - MCPツールの自動ディスカバリとオーケストレーション
  - ストリーミングレスポンスに対応
- **MCP 0.14.1**: Model Context Protocol
  - ツール定義の標準化とスキーマバリデーション
  - HTTP/SSE通信で疎結合に連携
  - VS Code MCPクライアントとも互換

### viem
- 型安全なEthereumクライアント
- Next.jsとの親和性が高い
- 軽量で高速
- マルチチェーン対応

### pnpm workspace
- `pkgs/` 配下の複数パッケージを一元管理
- Git submodule（`pkgs/jpyc-sdk`）を含む依存関係を整理
- MCPサーバーやフロントエンドを個別にビルド・実行可能

## セキュリティ設計

### 環境変数管理
- 秘密鍵・APIキーは `pkgs/frontend/.env.local` にまとめて設定
- MCPサーバーは `PRIVATE_KEY` を使用して署名（テストネット専用ウォレット必須）
- 値のハードコードは禁止

### プロセス分離によるセキュリティ
- ブロックチェーン操作: MCPサーバープロセス
- UI: Next.jsプロセス
- 秘密鍵: MCPサーバー側のみでアクセス
- HTTP/SSE経由で制御された通信

### クライアントサイド vs サーバーサイド
- ブロックチェーン操作: サーバーサイド（MCPサーバー）
- UI: クライアントサイド（React Components）
- API Routes: サーバーサイド（Next.js）

## 拡張性の考慮

### 新しいチェーン追加
1. `pkgs/mcp/src/jpyc/sdk.ts` の `CHAIN_ID_MAP` / `RPC_URLS` にエントリを追加
2. 必要に応じてエクスプローラーURLを `pkgs/mcp/src/tools.ts` に追加
3. Claudeの指示文 (`pkgs/frontend/src/lib/mastra/agent.ts`) に対応チェーンを追記

### 新しいツール追加
1. `pkgs/mcp/src/tools.ts` に新ツール定義を追加
2. 入力スキーマをZodで定義し、必要なSDK操作を実装
3. エージェントが動的にツール一覧を取得するため、Mastra側の追加設定は不要

### AIモデルの切り替え
- `pkgs/frontend/src/lib/mastra/model/index.ts` で利用するモデルを切り替え
- Claude（デフォルト）・OpenAI・Google間の切り替えが容易

## トラブルシューティング

1. **MCPサーバーの状態を確認**: `pnpm run mcp:dev` のログでツール呼び出しが成功しているか確認。
2. **ヘルスチェック**: `curl http://localhost:3001/health` が `{ "status": "ok" }` を返すか確認。
3. **接続設定**: フロントエンドの `JPYC_MCP_SERVER_URL` が実際のサーバーURLと一致しているか確認。
4. **環境変数**: `PRIVATE_KEY` がテストネット用で残高が十分か、APIキーが有効かを確認。
5. **チェーン整合性**: `pkgs/mcp/src/jpyc/sdk.ts` のチェーン設定と実際に切り替えたいチェーンが一致しているか検証。
