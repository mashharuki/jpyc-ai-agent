# プロジェクト概要

## プロジェクト名
JPYC AI Agent

## 目的
自然言語でJPYC（日本円ステーブルコイン）の操作を可能にするAIチャットアプリケーション。学習用・プロトタイプとして開発されている。

## 主要機能
- 自然言語でのJPYC送金、残高照会、チェーン切り替え
- マルチチェーン対応（Ethereum Sepolia、Polygon Amoy、Avalanche Fuji）
- トランザクション追跡とエクスプローラーリンク生成
- OpenAI gpt-4o-miniまたはGoogle Gemini 2.5 Proを使ったAIアシスタント
- プロフィール管理と友達リスト機能（ローカルストレージ）

## 技術スタック

### フレームワーク・ライブラリ
- **Next.js 15.1** - Reactフレームワーク（App Router）
- **React 19** - UIライブラリ
- **TypeScript 5.7** - 型安全な開発
- **Tailwind CSS 3.4** - スタイリング

### AI・エージェント
- **Mastra 0.23.3** - AIエージェントフレームワーク
- **MCP (Model Context Protocol) 0.14.1** - ツール統合プロトコル
- **OpenAI GPT-4o-mini** - 自然言語処理（メイン）
- **Google Gemini 2.5 Pro** - 代替AIモデル
- **Vercel AI SDK 5.0** - AI統合ライブラリ

### ブロックチェーン
- **JPYC SDK Core** (workspace) - JPYCトークン操作SDK
- **viem 2.38** - 型安全なEthereumクライアント
- **soltypes 2.0** - Solidity型定義

### 開発ツール
- **Biome 2.3** - Linter & Formatter
- **pnpm 8.9** - パッケージマネージャー（workspace対応）
- **tsx 4.20** - TypeScript実行環境

## プロジェクト構成の特徴

### MCPサーバーの独立化
- `external/mcp/` に独立したMCPサーバーを配置
- HTTP/SSE経由でMCPプロトコルを実装
- `http://localhost:3001/sse` でMCPツールを公開
- Next.jsアプリとは別プロセスで動作

### Git Submodule管理
- `external/jpyc-sdk/` にJPYC SDKをsubmoduleとして配置
- workspace機能で統合管理

### モノレポ構成
- ルート: Next.jsアプリケーション
- `external/jpyc-sdk`: JPYC SDK（submodule）
- `external/mcp`: MCPサーバー（独立プロセス）

## 起動方法

1. MCPサーバー起動: `pnpm run mcp:dev`
2. Next.jsアプリ起動: `pnpm run dev`

両方のプロセスが必要。
