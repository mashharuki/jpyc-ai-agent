# プロジェクト概要

## プロジェクト名
JPYC AI Agent

## 目的
自然言語でJPYC（日本円ステーブルコイン）の操作を可能にするAIチャットアプリケーション。学習用・プロトタイプとして開発されている。

## 主要機能
- 自然言語でのJPYC送金、残高照会、チェーン切り替え
- マルチチェーン対応（Ethereum Sepolia、Polygon Amoy、Avalanche Fuji）
- トランザクション追跡とエクスプローラーリンク生成
- OpenAI gpt-4o-miniを使ったAIアシスタント

## 技術スタック

### フレームワーク・ライブラリ
- **Next.js 15** - Reactフレームワーク
- **React 19** - UIライブラリ
- **TypeScript 5.7** - 型安全な開発
- **Tailwind CSS** - スタイリング

### AI・エージェント
- **Mastra** - AIエージェントフレームワーク
- **MCP (Model Context Protocol)** - ツール統合
- **OpenAI GPT-4o-mini** - 自然言語処理

### ブロックチェーン
- **JPYC SDK** (git submodule) - JPYCトークン操作
- **viem** - Ethereumクライアント
- **soltypes** - Solidity型定義

### パッケージ管理
- **pnpm** - モノレポ対応のパッケージマネージャー
- **pnpm workspace** - external/jpyc-sdkをサブモジュールとして管理

## プロジェクト構成
- ルート: Next.jsアプリケーション
- `external/jpyc-sdk`: Git submoduleとしてJPYC SDKを配置
- `src/app`: Next.js App Router
- `src/components`: Reactコンポーネント
- `src/lib`: ユーティリティとビジネスロジック
- `src/mcp-server`: MCPツール定義
