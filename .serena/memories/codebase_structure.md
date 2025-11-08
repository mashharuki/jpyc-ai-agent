# コードベース構造

## ディレクトリ構成

```
jpyc-ai-agent/
├── pkgs/
│   ├── frontend/                     # Next.js + Mastra + MCP Client
│   │   ├── src/
│   │   │   ├── app/                  # App Router と API Routes
│   │   │   │   ├── api/              # チャット/チェーン/プロフィール等のエンドポイント
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/           # UIコンポーネント（ChatInterfaceなど）
│   │   │   └── lib/
│   │   │       ├── mastra/           # エージェント・モデル・MCPクライアント
│   │   │       ├── jpyc/             # MCP補助ユーティリティ
│   │   │       └── storage/          # ローカルストレージ抽象化
│   │   ├── public/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mcp/                          # 独立したMCPサーバー
│   │   ├── src/
│   │   │   ├── index.ts             # HTTP/SSE + MCP Server
│   │   │   ├── tools.ts             # ツール定義
│   │   │   └── jpyc/sdk.ts          # JPYC SDK初期化とチェーン管理
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── jpyc-sdk/                     # Git submodule（@jpyc/sdk-core 等）
│       └── packages/
│           ├── core/
│           └── react/
│
├── AGENTS.md                         # AI開発ガイドライン
├── README.md                         # ルートドキュメント
├── package.json                      # ルートスクリプト（build等）
├── pnpm-workspace.yaml               # pnpmワークスペース設定
├── pnpm-lock.yaml                    # ロックファイル
├── biome.json                        # Biome設定
└── .serena/                          # Serenaメモリーファイル
```

## 主要モジュールの役割

### `pkgs/mcp/src/index.ts`
- 独立したMCPサーバー
- HTTP/SSEでクライアントと通信（デフォルト: ポート3001）
- `/sse`, `/message`, `/health` エンドポイントを提供
- 起動時にCORSヘッダーを設定してNext.jsアプリからの接続を許可

### `pkgs/mcp/src/jpyc/sdk.ts`
- JPYC SDK Coreの初期化とチェーン管理
- シングルトン的にインスタンスを保持し、`switchChain` で状態を更新
- `getCurrentAddress`, `getCurrentChain`, `jpyc` ラッパーをエクスポート

### `pkgs/mcp/src/tools.ts`
- MCPツール定義を一括管理
- `jpyc_balance`, `jpyc_transfer`, `jpyc_total_supply`, `jpyc_switch_chain`, `jpyc_get_current_chain`
- エクスプローラーURLの組み立てなど補助処理も担当

### `pkgs/frontend/src/lib/mastra/agent.ts`
- Mastraエージェント定義
- デフォルトモデルは Claude 3.5 Sonnet
- MCPクライアントから動的にツールを取得し、友達リスト情報を扱う指示を保持

### `pkgs/frontend/src/lib/mastra/mcp/client.ts`
- MCPクライアント初期化処理
- `JPYC_MCP_SERVER_URL` を参照しHTTP/SSEで接続
- ツール一覧をキャッシュしてMastraへ渡す

### `pkgs/frontend/src/lib/mastra/model/index.ts`
- Claude / GPT-4o-mini / Gemini のモデル設定
- `@ai-sdk/*` を利用してMastraに対応するクライアントを構築

### `pkgs/frontend/src/components/ChatInterface.tsx`
- チャットUIと状態管理
- API呼び出しやストリーミングレスポンスのハンドリング
- プロフィール・友達設定モーダルを内包

### `pkgs/frontend/src/app/api/chat/route.ts`
- チャットAPIエンドポイント
- フロントエンドからのリクエストをMastraエージェントに委譲
- プロフィール・友達情報をメッセージ末尾に付与

### `pkgs/frontend/src/lib/storage/localStorage.ts`
- ローカルストレージ抽象化
- プロフィール・友達リストの読み書きを型安全に実装
- 追加のユーティリティ型は `pkgs/frontend/src/lib/storage/types.ts`

## 依存関係の流れ

### MCPベースのフロー（現在の実装）
1. ユーザーがチャットUIで入力
2. `ChatInterface.tsx` が `/api/chat` にリクエスト送信
3. `/api/chat/route.ts` が Mastra エージェントを実行
4. エージェント → MCPクライアント → MCPサーバー
5. MCPサーバー (`pkgs/mcp`) が JPYC SDK (`pkgs/mcp/src/jpyc/sdk.ts`) を呼び出し
6. JPYC SDK がブロックチェーンと通信し結果を返す

### 重要なポイント
- MCPサーバーとフロントエンドをプロセス分離（セキュリティ向上）
- `pkgs/frontend/src/lib/jpyc/sdk.ts` はフロントエンド補助用で、実際の送金ロジックは MCP 側に集約
- 追加チェーンに対応する場合は `pkgs/mcp/src/jpyc/sdk.ts` と `pkgs/mcp/src/tools.ts` を更新
