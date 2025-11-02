# アーキテクチャとデザインパターン

## アーキテクチャ概要

### レイヤー構成（MCP統合版）
```
┌─────────────────────────────────┐
│   UI Layer (React Components)  │  ← ChatInterface.tsx
├─────────────────────────────────┤
│   API Layer (Next.js Routes)   │  ← /api/chat, /api/chain, etc.
├─────────────────────────────────┤
│   Agent Layer (Mastra)          │  ← agent.ts
├─────────────────────────────────┤
│   MCP Client Layer              │  ← mcp/client.ts
├─────────────────────────────────┤  HTTP/SSE
│   MCP Server Layer              │  ← external/mcp/src/index.ts
├─────────────────────────────────┤
│   Tool Layer (MCP Tools)        │  ← external/mcp/src/tools.ts
├─────────────────────────────────┤
│   SDK Layer (JPYC SDK)          │  ← external/mcp/src/jpyc/sdk.ts
├─────────────────────────────────┤
│   Blockchain Layer (viem)       │  ← Ethereum, Polygon, Avalanche
└─────────────────────────────────┘
```

### プロセス分離
- **Next.jsプロセス**: Webアプリケーション（ポート3000）
- **MCPサーバープロセス**: ブロックチェーン操作（ポート3001）

## デザインパターン

### 1. シングルトンパターン（SDK管理）
`external/mcp/src/jpyc/sdk.ts` でグローバル状態を管理:
- `_jpycInstance`: JPYC SDKインスタンス
- `_currentChain`: 現在のチェーン
- `_account`, `_publicClient`, `_walletClient`: クライアント群

利点:
- アプリケーション全体で1つのSDKインスタンスを共有
- チェーン切り替え時の状態一貫性を保証
- MCPサーバー内でステートフル管理

### 2. ファクトリーパターン（クライアント生成）
`createClients()` 関数でチェーン別にクライアントを生成
- テストネット用のRPC設定
- チェーンごとのコントラクトアドレス

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
`src/lib/storage/` でローカルストレージを抽象化:
- 型安全なストレージ操作
- プロフィール・友達管理
- 将来的なストレージ実装変更に対応しやすい

## 主要な技術選択

### Mastra + MCP
- **Mastra 0.23.3**: エージェントフレームワーク
  - OpenAI/Google AI統合
  - ツールオーケストレーション
  - ストリーミング対応
- **MCP 0.14.1**: Model Context Protocol
  - ツール定義の標準化
  - LLMとツールの疎結合
  - HTTP/SSE通信

### viem
- 型安全なEthereumクライアント
- Next.jsとの親和性が高い
- 軽量で高速
- マルチチェーン対応

### pnpm workspace
- モノレポ管理
- Git submodule（jpyc-sdk）との統合
- 独立したMCPサーバーパッケージ

## セキュリティ設計

### 環境変数管理
- 秘密鍵、APIキーは `.env.local` で管理
- ハードコード禁止
- テストネット専用ウォレット使用を推奨

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
1. `external/mcp/src/jpyc/sdk.ts` の `CHAIN_MAP` に追加
2. RPC URLとコントラクトアドレスを設定
3. 既存ツールがそのまま動作

### 新しいツール追加
1. `external/mcp/src/tools.ts` に新ツール定義を追加
2. Zodスキーマでパラメータ定義
3. エージェントが自動的に利用可能

### AIモデルの切り替え
- `src/lib/mastra/model/index.ts` で設定
- OpenAI ↔ Gemini の切り替えが容易

## トラブルシューティング

### 現在のデバッグ課題
- ストリーミングレスポンスが空になる問題
- `generate()` メソッドでもテキストが空
- エージェントがツールを呼び出すがレスポンス生成しない

### デバッグ手法
1. MCPサーバーのログ確認（ポート3001）
2. MCPツール呼び出しの確認
3. エージェントのステップ解析
4. AIモデルの直接呼び出しテスト
