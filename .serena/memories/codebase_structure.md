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
│   │       ├── chat/             # チャットエンドポイント
│   │       ├── chain/            # チェーン情報取得
│   │       ├── profile/          # プロフィール
│   │       ├── address/          # アドレス情報
│   │       └── friends/          # フレンド機能
│   │
│   ├── components/               # Reactコンポーネント
│   │   └── ChatInterface.tsx    # チャットUI
│   │
│   ├── lib/                      # ビジネスロジック・ユーティリティ
│   │   ├── jpyc/
│   │   │   └── sdk.ts            # JPYC SDK操作の中核
│   │   ├── mastra/
│   │   │   └── agent.ts          # Mastraエージェント定義
│   │   └── storage/
│   │       ├── localStorage.ts   # ローカルストレージ抽象化
│   │       └── types.ts          # ストレージ型定義
│   │
│   └── mcp-server/               # MCPツール定義
│       ├── types.ts              # MCP型定義
│       └── tools/                # 各種ツール
│           ├── balance.ts        # 残高照会
│           ├── getCurrentChain.ts # 現在のチェーン取得
│           ├── switchChain.ts    # チェーン切り替え
│           ├── transfer.ts       # 送金処理
│           └── totalSupply.ts    # 総供給量照会
│
├── external/
│   └── jpyc-sdk/                 # Git submodule（JPYC SDK）
│
├── public/                       # 静的ファイル
├── .vscode/
│   └── mcp.json                  # MCP設定
├── .env.local.example            # 環境変数テンプレート
├── AGENTS.md                     # AI駆動開発ガイドライン
├── README.md                     # プロジェクトドキュメント
├── package.json                  # 依存関係とスクリプト
├── pnpm-workspace.yaml           # pnpmワークスペース設定
├── tsconfig.json                 # TypeScript設定
├── biome.json                    # Biome設定
├── .eslintrc.json                # ESLint設定
├── next.config.js                # Next.js設定
├── tailwind.config.ts            # Tailwind CSS設定
└── postcss.config.js             # PostCSS設定
```

## 主要モジュールの役割

### `src/lib/jpyc/sdk.ts`
- JPYC SDK操作の中核
- チェーン切り替え、アドレス取得、クライアント管理
- グローバル状態として以下を管理:
  - `_jpycInstance`: JPYC SDKインスタンス
  - `_currentChain`: 現在のチェーン
  - `_account`: アカウント情報
  - `_publicClient`: 読み取り専用クライアント
  - `_walletClient`: 書き込み可能クライアント

### `src/lib/mastra/agent.ts`
- Mastraエージェント定義
- OpenAI gpt-4o-miniモデル設定
- MCPツールとの統合

### `src/mcp-server/tools/`
- MCP (Model Context Protocol) ツール群
- 各ツールは特定のブロックチェーン操作を実行
- エージェントから呼び出される

### `src/components/ChatInterface.tsx`
- チャットUIコンポーネント
- ユーザー入力とAI応答の表示

### `src/app/api/chat/route.ts`
- チャットAPIエンドポイント
- Mastraエージェントを呼び出し

## 依存関係の流れ

1. ユーザーがチャットUIで入力
2. `ChatInterface.tsx` → `/api/chat` エンドポイント
3. `/api/chat/route.ts` → Mastraエージェント
4. Mastraエージェント → MCPツール
5. MCPツール → JPYC SDK (`src/lib/jpyc/sdk.ts`)
6. JPYC SDK → ブロックチェーン
