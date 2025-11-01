# アーキテクチャとデザインパターン

## アーキテクチャ概要

### レイヤー構成
```
┌─────────────────────────────────┐
│   UI Layer (React Components)  │  ← ChatInterface.tsx
├─────────────────────────────────┤
│   API Layer (Next.js Routes)   │  ← /api/chat, /api/chain, etc.
├─────────────────────────────────┤
│   Agent Layer (Mastra)          │  ← agent.ts
├─────────────────────────────────┤
│   Tool Layer (MCP)              │  ← mcp-server/tools/*
├─────────────────────────────────┤
│   SDK Layer (JPYC SDK)          │  ← lib/jpyc/sdk.ts
├─────────────────────────────────┤
│   Blockchain Layer (viem)       │  ← Ethereum, Polygon, etc.
└─────────────────────────────────┘
```

## デザインパターン

### 1. シングルトンパターン（SDK管理）
`src/lib/jpyc/sdk.ts` でグローバル状態を管理:
- `_jpycInstance`: JPYC SDKインスタンス
- `_currentChain`: 現在のチェーン
- `_account`, `_publicClient`, `_walletClient`: クライアント群

利点:
- アプリケーション全体で1つのSDKインスタンスを共有
- チェーン切り替え時の状態一貫性を保証

### 2. ファクトリーパターン（クライアント生成）
`createClients()` 関数でチェーン別にクライアントを生成

### 3. ツールパターン（MCP）
各ブロックチェーン操作を独立したツールとして定義:
- `balance.ts`: 残高照会
- `transfer.ts`: 送金
- `switchChain.ts`: チェーン切り替え
- `getCurrentChain.ts`: 現在のチェーン取得
- `totalSupply.ts`: 総供給量照会

利点:
- 各機能が独立してテスト・保守可能
- 新しいツール追加が容易

### 4. レイヤードアーキテクチャ
各レイヤーが明確に分離:
- UI層: ユーザーインターフェース
- API層: HTTPエンドポイント
- エージェント層: AI意思決定
- ツール層: ブロックチェーン操作
- SDK層: 低レベルAPI

### 5. ストレージ抽象化
`src/lib/storage/` でローカルストレージを抽象化:
- 型安全なストレージ操作
- 将来的なストレージ実装変更に対応しやすい

## 主要な技術選択

### Mastra + MCP
- **Mastra**: エージェントフレームワーク
  - OpenAI統合
  - ツールオーケストレーション
- **MCP**: Model Context Protocol
  - ツール定義の標準化
  - LLMとツールの疎結合

### viem
- 型安全なEthereumクライアント
- Next.jsとの親和性が高い
- 軽量で高速

### pnpm workspace
- モノレポ管理
- Git submodule（jpyc-sdk）との統合

## セキュリティ設計

### 環境変数管理
- 秘密鍵、APIキーは `.env.local` で管理
- ハードコード禁止
- テストネット専用ウォレット使用を推奨

### クライアントサイド vs サーバーサイド
- ブロックチェーン操作: サーバーサイド（API Routes）
- UI: クライアントサイド（React Components）
- 秘密鍵: サーバーサイドのみでアクセス

## 拡張性の考慮

### 新しいチェーン追加
1. `src/lib/jpyc/sdk.ts` の `CHAIN_MAP` に追加
2. RPC URLとコントラクトアドレスを設定
3. 既存ツールがそのまま動作

### 新しいツール追加
1. `src/mcp-server/tools/` に新ファイル作成
2. `src/lib/mastra/agent.ts` でツールを登録
3. エージェントが自動的に利用可能
