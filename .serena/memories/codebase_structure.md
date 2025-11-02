# コードベース構造

## ディレクトリ構成

```
jpyc-ai-agent/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── page.tsx              # トップページ
│   │   ├── globals.css           # グローバルスタイル
│   │   └── api/                  # API Routes
│   │       ├── chat/             # チャットエンドポイント（Mastra統合）
│   │       │   └── route.ts
│   │       ├── chain/            # チェーン情報取得
│   │       │   └── route.ts
│   │       ├── profile/          # プロフィール管理
│   │       │   └── route.ts
│   │       ├── address/          # アドレス情報
│   │       │   └── route.ts
│   │       └── friends/          # フレンド機能
│   │           └── route.ts
│   │
│   ├── components/               # Reactコンポーネント
│   │   └── ChatInterface.tsx    # チャットUI（メイン）
│   │
│   └── lib/                      # ビジネスロジック・ユーティリティ
│       ├── jpyc/
│       │   └── sdk.ts            # JPYC SDK操作（非推奨・互換性用）
│       ├── mastra/
│       │   ├── agent.ts          # Mastraエージェント定義
│       │   ├── mcp/
│       │   │   └── client.ts     # MCPクライアント設定
│       │   └── model/
│       │       └── index.ts      # AIモデル設定
│       └── storage/
│           ├── localStorage.ts   # ローカルストレージ抽象化
│           └── types.ts          # ストレージ型定義
│
├── external/
│   ├── jpyc-sdk/                 # Git submodule（JPYC SDK）
│   │   ├── packages/
│   │   │   ├── core/             # Core SDK
│   │   │   └── react/            # React Hooks
│   │   └── docs/                 # ドキュメント
│   │
│   └── mcp/                      # MCPサーバー（独立プロセス）
│       ├── src/
│       │   ├── index.ts          # HTTPサーバー＋MCP統合
│       │   ├── tools.ts          # ツール定義エクスポート
│       │   └── jpyc/
│       │       └── sdk.ts        # JPYC SDK管理
│       ├── package.json
│       └── tsconfig.json
│
├── public/                       # 静的ファイル
│   └── demo_image.png
│
├── .vscode/
│   └── mcp.json                  # MCP設定（VS Code統合）
│
├── .env.local.example            # 環境変数テンプレート
├── AGENTS.md                     # AI駆動開発ガイドライン
├── README.md                     # プロジェクトドキュメント
├── package.json                  # 依存関係とスクリプト
├── pnpm-workspace.yaml           # pnpmワークスペース設定
├── tsconfig.json                 # TypeScript設定
├── biome.json                    # Biome設定
├── next.config.js                # Next.js設定
├── tailwind.config.ts            # Tailwind CSS設定
└── postcss.config.js             # PostCSS設定
```

## 主要モジュールの役割

### `external/mcp/src/index.ts`
- **独立したMCPサーバー**
- HTTP/SSE経由でMCPプロトコルを実装
- ポート3001でリッスン
- エンドポイント:
  - `/sse`: SSE接続
  - `/message`: メッセージ送信
  - `/health`: ヘルスチェック

### `external/mcp/src/jpyc/sdk.ts`
- JPYC SDK操作の実装
- チェーン切り替え、送金、残高照会など
- グローバル状態管理:
  - `_jpycInstance`: JPYC SDKインスタンス
  - `_currentChain`: 現在のチェーン（sepolia/amoy/fuji）
  - `_account`, `_publicClient`, `_walletClient`

### `src/lib/mastra/agent.ts`
- Mastraエージェント定義
- OpenAI gpt-4o-miniモデル設定
- MCPツールとの統合（動的ロード）
- エージェント指示（instructions）の定義

### `src/lib/mastra/mcp/client.ts`
- MCPクライアント設定
- MCPサーバーへの接続（http://localhost:3001/sse）

### `src/lib/mastra/model/index.ts`
- AIモデル設定
- OpenAI（gpt-4o-mini）
- Google（gemini-2.5-pro）

### `src/components/ChatInterface.tsx`
- チャットUIコンポーネント
- メッセージ履歴管理
- ストリーミング対応
- プロフィール・友達リスト管理

### `src/app/api/chat/route.ts`
- チャットAPIエンドポイント
- Mastraエージェントを呼び出し
- プロフィール・友達情報をコンテキストに追加
- ストリーミングレスポンス（現在デバッグ中）

### `src/lib/storage/localStorage.ts`
- ローカルストレージ抽象化
- プロフィール管理（名前・アドレス）
- 友達リスト管理
- 型安全なストレージ操作

## 依存関係の流れ

### MCPベースのフロー（現在の実装）
1. ユーザーがチャットUIで入力
2. `ChatInterface.tsx` → `/api/chat` エンドポイント
3. `/api/chat/route.ts` → Mastraエージェント
4. Mastraエージェント → MCPクライアント → MCPサーバー
5. MCPサーバー → JPYC SDK (`external/mcp/src/jpyc/sdk.ts`)
6. JPYC SDK → ブロックチェーン

### 重要な変更点
- MCPサーバーが独立プロセスとして動作
- `src/lib/jpyc/sdk.ts` は互換性用（非推奨）
- 実際のSDK操作は `external/mcp/src/jpyc/sdk.ts` で実施
