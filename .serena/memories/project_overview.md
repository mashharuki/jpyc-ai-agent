# プロジェクト概要

## プロジェクト名
JPYC AI Agent

## 目的
自然言語でJPYC（日本円ステーブルコイン）を操作できる学習用AIチャットアプリケーション。ブロックチェーン操作を会話ベースで体感することがゴール。

## 主要機能
- 自然言語による送金・残高照会・総供給量照会・チェーン切り替え
- 対応チェーン: Ethereum Sepolia（推奨・デフォルト）、Avalanche Fuji（動作確認済み）、Polygon Amoy（準備中）
- トランザクション完了後にエクスプローラーリンクを提示
- Mastra + MCP を活用したAIエージェント連携
- プロフィールと友達リストをローカルストレージで管理し、名前指定で送金/照会

## 技術スタック

### フロントエンド
- **Next.js 15.1 (App Router)**
- **React 19**
- **TypeScript 5.7**
- **Tailwind CSS 3.4**

### AI / エージェント
- **Mastra 0.23.3**（エージェントフレームワーク）
- **Anthropic Claude 3.5 Sonnet**（推奨モデル）
- **OpenAI GPT-4o-mini / Google Gemini 2.5 Pro**（代替モデル）
- **Vercel AI SDK 5.0**（AIクライアント統合）

### ブロックチェーン
- **@jpyc/sdk-core 2.0.0**（Git submoduleとして同梱）
- **viem 2.38**（EVMクライアント）

### 開発ツール
- **pnpm 10 ワークスペース**（モノレポ管理）
- **Biome 2.3**（フォーマッタ兼リンタ）
- **tsx 4.20**（MCPサーバー開発）

## プロジェクト構成の特徴

### モノレポ構成
- `pkgs/frontend`: Next.jsアプリ、Mastraエージェント、MCPクライアント
- `pkgs/mcp`: 独立したMCPサーバー（HTTP/SSEでツールを提供）
- `pkgs/jpyc-sdk`: JPYC SDK（core/reactパッケージをsubmoduleとして保持）

### 安全なSDK利用
- MCPサーバーを介してJPYC SDKへアクセス
- ブロックチェーン操作を別プロセスに隔離
- Claudeが自然言語を適切なMCPツール呼び出しに変換

## 起動方法

1. 依存関係をインストール: `pnpm install`
2. MCPサーバーを起動: `pnpm run mcp:dev`
3. フロントエンド開発サーバーを起動: `pnpm --filter frontend dev`

## 環境変数
- `pkgs/frontend/.env.local` に設定
- 必須: `PRIVATE_KEY`, `ANTHROPIC_API_KEY`（または OpenAI/Gemini キー）, `JPYC_MCP_SERVER_URL`
