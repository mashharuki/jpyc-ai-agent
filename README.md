# JPYC AI Agent

```bh
※ 本サービス（コンテンツ・作品等）はJPYC株式会社による公式コンテンツではありません。
※ 「JPYC」はJPYC株式会社の提供するステーブルコインです。
※ JPYC及びJPYCロゴは、JPYC株式会社の登録商標です。
```

自然言語でJPYCトークンを操作できるAIチャットアプリケーション

![デモ画面](./pkgs/frontend/public/demo_image.png)

---

## 📖 概要

JPYC AI Agentは、チャットで指示を送るだけでJPYC（日本円ステーブルコイン）の送信や残高照会ができるAIアシスタントです。ブロックチェーンの複雑な操作を自然言語で実行できます。

---

## 🎯 主要機能

### 自然言語でのJPYC操作
- 💬 「0x123...に100JPYC送って」のような会話で送信可能
- 🔄 「Polygon Amoyに切り替えて」でチェーン変更
- 💰 「残高教えて」で即座に残高確認
- 📊 「流通量は？」で総供給量を照会

### マルチチェーン対応
- ✅ **Ethereum Sepolia** (推奨・動作確認済み)
- ⚠️ Polygon Amoy (未確認)
- ⚠️ Avalanche Fuji (未確認)

### トランザクション追跡
- 送信後、自動的にエクスプローラーリンクを生成
- ワンクリックでトランザクション詳細を確認可能

### AIアシスタント機能
- Claude (Anthropic) による自然言語解釈（推奨）
- OpenAI GPT-4o-mini / Google Gemini にも対応
- Mastra フレームワークでツール統合
- MCP (Model Context Protocol) でブロックチェーン操作

### ソーシャル機能
- 友達リストを登録して名前で送金可能
- 「太郎に100JPYC送って」のような自然な指示が可能
- プロフィール管理機能

---

## 🚀 事前準備

### 1. 環境変数のテンプレートファイルを作成する

```bash
cd pkgs/frontend
cp .env.local.example .env.local
```

セットアップが必要な環境変数は以下の通り：

```bash
# JPYC SDK Configuration
# ⚠️ 本番環境では絶対に使用しないでください！テストネット専用です
PRIVATE_KEY=0x... # テストネット用の秘密鍵

# AI API Keys(自分の使いたいモデルに必要なAPIキーをセットしてください。 ※ Claudeを推奨)
OPENAI_API_KEY=sk-proj-... # OpenAI APIキー
GOOGLE_GENERATIVE_AI_API_KEY= # Gemini APIキー
ANTHROPIC_API_KEY= # Claude APIキー（推奨）
# JPYC MCPサーバーURL
JPYC_MCP_SERVER_URL="http://localhost:3001/sse"
```

### 2. AI APIキーを発行する

#### Claude APIキー（推奨）

[Anthropic Console](https://console.anthropic.com/) にアクセスしてAPIキーを発行してください。

1. **Anthropic Console にアクセス**
   - https://console.anthropic.com/ にアクセス

2. **アカウントを作成またはログイン**
   - 新規の場合はサインアップ

3. **API Keysセクションで新しいキーを作成**
   - Settings → API Keys → Create Key

4. **生成されたAPIキーを取得する**
   - `sk-ant-...` の形式のキーをコピー

5. **APIキーを環境変数に設定**
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   ```

#### OpenAI APIキー（代替）

[OpenAI Platform](https://platform.openai.com/) にアクセスしてAPIキーを発行してください。

1. **OpenAI Platform にアクセス**
   - https://platform.openai.com/ にアクセス

2. **アカウントを作成またはログイン**

3. **API Keysセクションで新しいキーを作成**

4. **APIキーを環境変数に設定**
   ```bash
   OPENAI_API_KEY=sk-proj-...
   ```

#### Google Gemini APIキー（代替）

[Google AI Studio](https://aistudio.google.com/) にアクセスしてAPIキーを発行してください。

### 3. テストネット用ウォレットの秘密鍵を設定する

⚠️ **重要**: 本番環境のウォレットは絶対に使用しないでください

1. **テストネット専用のウォレットを作成**
   - MetaMaskなどで新しいウォレットを作成

2. **秘密鍵をエクスポート**
   - MetaMask → アカウント詳細 → 秘密鍵のエクスポート

3. **秘密鍵を環境変数に設定**
   ```bash
   PRIVATE_KEY=0x...
   ```

### 4. テストネットトークンを取得する

#### Ethereum Sepolia（推奨）
- [Sepolia Faucet](https://sepoliafaucet.com/) でSepoliaETHを取得
- ガス代として使用されます

#### JPYC テストトークン
- [JPYC Faucet](https://faucet.jpyc.jp/login)でJPYC テストトークンを取得

*こちらはJPYC Prepaid版のFaucetです。資金移動業版リリースまでは今しばらくお待ちください。*

---

## 🛠️ セットアップ

### リポジトリのクローン

```bash
git clone --recurse-submodules https://github.com/mashharuki/jpyc-ai-agent.git
cd jpyc-ai-agent
```

### クローンした後に git submodulesを追加するコマンド

```bash
git submodule update --init --recursive
```

### インストール

このプロジェクトは **pnpm ワークスペース** で管理されています。

```bash
pnpm install
```

JPYC SDKはGit submoduleとして`pkgs/jpyc-sdk`に配置されています。

### ビルド

```bash
pnpm build
```

### 起動

**必ずビルドした後に実行してください！**

まずJPYC MCP サーバーを起動させます。

```bash
pnpm run mcp:dev
```

これで、 `http://localhost:3001` でJPYC MCPサーバーが立ち上がります。

この状態でWebアプリを起動させます。

```bash
pnpm --filter frontend dev
```

アプリケーションが `http://localhost:3000` で起動します。

**もしAIチャットの出力がオブジェクト形式になっている場合は `pkgs/frontend/src/lib/mastra/agent.ts`で使用しているモデルを別のもの(OpenAIやGeminiなど)に切り替えてみてください。**

---

## 💡 動かし方

### 基本的な使い方

アプリケーションを起動すると、チャット画面が表示されます。
自然言語で指示を入力するだけで、JPYC操作が可能です。

### 会話例

#### 1. 残高照会

```
ユーザー: 残高教えて
アシスタント: Ethereum Sepoliaチェーンの残高は 1,000 JPYC です
```

#### 2. 特定アドレスの残高照会

```
ユーザー: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbの残高を教えて
アシスタント: Ethereum Sepoliaチェーンの残高は 500 JPYC です
```

#### 3. 送信

```
ユーザー: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbに100JPYC送って
アシスタント: 0x742d35Cc...に 100 JPYC送りました！
トランザクションは[こちらで確認](https://sepolia.etherscan.io/tx/0x...)できます（Ethereum Sepolia）
```

#### 4. 総供給量照会

```
ユーザー: 流通量教えて
アシスタント: 現在のEthereum Sepoliaでの総供給量は 100,000,000 JPYC です
```

#### 5. チェーン切り替え

```
ユーザー: Polygon Amoyに切り替えて
アシスタント: Polygon Amoy に切り替えました
```

```
ユーザー: Avalancheで実行して
アシスタント: Avalanche Fuji に切り替えました
```

#### 6. チェーン指定での送信

```
ユーザー: Sepoliaに切り替えて、0x742d35Cc...に50JPYC送って
アシスタント: Ethereum Sepolia に切り替えました

0x742d35Cc...に 50 JPYC送りました！
トランザクションは[こちらで確認](https://sepolia.etherscan.io/tx/0x...)できます
```

#### 7. 友達に送金

```
ユーザー: 太郎に100JPYC送って
アシスタント: 太郎さん（0x742d35Cc...）に 100 JPYC送りました！
トランザクションは[こちらで確認](https://sepolia.etherscan.io/tx/0x...)できます
```

---

## 🏗️ プロジェクト構造

このプロジェクトは **pnpm ワークスペース** によるモノレポ構成です。

```
jpyc-ai-agent/
├── pkgs/
│   ├── frontend/                       # Next.js フロントエンド
│   │   ├── src/
│   │   │   ├── app/                    # Next.js App Router
│   │   │   │   ├── api/
│   │   │   │   │   ├── chat/route.ts  # チャットAPIエンドポイント
│   │   │   │   │   ├── chain/route.ts # チェーン情報取得API
│   │   │   │   │   ├── address/route.ts # アドレス取得API
│   │   │   │   │   ├── friends/route.ts # 友達リストAPI
│   │   │   │   │   └── profile/route.ts # プロフィールAPI
│   │   │   │   ├── layout.tsx         # ルートレイアウト
│   │   │   │   ├── page.tsx           # トップページ
│   │   │   │   └── globals.css        # グローバルスタイル
│   │   │   │
│   │   │   ├── components/
│   │   │   │   └── ChatInterface.tsx  # チャットUIコンポーネント
│   │   │   │
│   │   │   └── lib/
│   │   │       ├── mastra/
│   │   │       │   ├── agent.ts       # ★ Mastra AIエージェント定義
│   │   │       │   ├── model/         # AIモデル設定
│   │   │       │   └── mcp/           # MCPクライアント
│   │   │       ├── jpyc/
│   │   │       │   └── sdk.ts         # JPYC SDK ラッパー
│   │   │       └── storage/           # ローカルストレージ管理
│   │   │
│   │   ├── public/
│   │   │   └── demo_image.png         # デモ画像
│   │   ├── .env.local                 # 環境変数（Gitに含めない）
│   │   ├── .env.local.example         # 環境変数テンプレート
│   │   └── package.json
│   │
│   ├── mcp/                            # ★★ MCP サーバー実装
│   │   ├── src/
│   │   │   ├── index.ts               # MCPサーバーエントリーポイント
│   │   │   ├── tools.ts               # ★★★ MCPツール定義
│   │   │   └── jpyc/
│   │   │       └── sdk.ts             # JPYC SDK インスタンス
│   │   └── package.json
│   │
│   └── jpyc-sdk/                       # JPYC SDK（git submodule）
│       └── packages/
│           ├── core/                   # JPYC SDK Core
│           └── react/                  # JPYC SDK React
│
├── pnpm-workspace.yaml                 # pnpm ワークスペース設定
├── package.json                        # ルート package.json
├── biome.json                          # コードフォーマッター設定
├── AGENTS.md                           # AI駆動開発ガイドライン
└── README.md
```

---

## 🔧 技術要素

### Mastraとは

**Mastra**は、AIエージェントを構築するためのフレームワークです。

このプロジェクトでは、Mastraを使って：
- ユーザーの自然言語を解釈
- 適切なMCPツールを選択
- ツールを実行して結果を返す

### MCP (Model Context Protocol) とは

**MCP**は、AIモデルが外部ツールを呼び出すための標準化されたプロトコルです。

このプロジェクトでは、以下のMCPツールを実装：

| ツール名 | 機能 | 説明 |
|---------|------|------|
| `jpyc_transfer` | トークン送信 | 指定したアドレスにJPYCを送信 |
| `jpyc_balance` | 残高照会 | アドレスのJPYC残高を確認（省略時は自分の残高） |
| `jpyc_total_supply` | 総供給量照会 | JPYCの総供給量を確認 |
| `jpyc_switch_chain` | チェーン切り替え | テストネットを変更（sepolia/fuji） |
| `jpyc_get_current_chain` | 現在のチェーン取得 | 現在選択中のチェーンとアドレスを取得 |

### データフロー

```
ユーザー入力: "0x123...に100JPYC送って"
    ↓
ChatInterface (フロントエンド)
    ↓
API(/api/chat) にPOSTリクエスト
    ↓
Mastra Agent が自然言語を解釈
    ↓
Claude (Anthropic) が適切なツールを選択
    ↓
MCP Client → MCP Server (HTTP/SSE) に接続
    ↓
MCPツール実行 (jpyc_transfer)
    ↓
JPYC SDK (viem) でブロックチェーン操作
    ↓
トランザクション送信 → 結果をユーザーに返す
```

### JPYC SDKについて

このプロジェクトでは、JPYC SDK Coreをsubmoduleとして統合しています：

- **リポジトリ**: https://github.com/jcam1/sdks (develop branch)
- **配置場所**: `pkgs/jpyc-sdk/packages/core`
- **ビルドスクリプト**: `pnpm build`実行時に自動でコンパイル
- **利点**:
  - 公式SDKの全機能が利用可能
  - ソースコードから直接ビルドするため最新の機能に対応
  - カスタマイズが容易

### MCP Serverについて

このプロジェクトでは、独立したMCPサーバーを実装しています：

- **配置場所**: `pkgs/mcp`
- **起動コマンド**: `pnpm run mcp:dev`
- **通信方式**: HTTP/SSE (Server-Sent Events)
- **ポート**: 3001
- **利点**:
  - フロントエンドとバックエンドの分離
  - MCPプロトコルの実装を学習できる
  - 他のプロジェクトからも再利用可能

---

## 📝 対応チェーン

### テストネット

| チェーン | RPC URL | Explorer |
|---------|---------|----------|
| Ethereum Sepolia| `https://ethereum-sepolia-rpc.publicnode.com` | [Etherscan](https://sepolia.etherscan.io/) |
| Polygon Amoy| `https://rpc-amoy.polygon.technology` | [PolygonScan](https://amoy.polygonscan.com/) |
| Avalanche Fuji| `https://api.avax-test.network/ext/bc/C/rpc` | [SnowTrace](https://testnet.snowtrace.io/) |

**JPYCコントラクトアドレス（全チェーン共通）**: `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB`

---

## 🔒 セキュリティ

### 重要な注意事項

- 秘密鍵は `.env.local` に保存されます（Gitにコミットされません）
- **テストネット専用のウォレットを使用してください**
- 本番環境の秘密鍵を絶対に使用しないでください
- `.env.local` はリポジトリにコミットしないでください（`.gitignore`に追加済み）

## � 開発用コマンド

```bash
# 全体のビルド
pnpm build

# フロントエンド開発サーバー起動
pnpm --filter frontend dev

# MCPサーバー開発サーバー起動
pnpm run mcp:dev

# コードフォーマット
pnpm format

# フロントエンドのみビルド
pnpm --filter frontend build

# MCPサーバーのみビルド
pnpm --filter @jpyc/mcp-server build
```

---

## 📚 参考文献・リソース

### JPYC関連
- [JPYC公式サイト](https://jpyc.jp/)
- [JPYC SDK GitHub](https://github.com/jcam1/sdks)
- [JPYC v2 Contracts](https://github.com/jcam1/JPYCv2)
- [JPYC Faucet](https://faucet.jpyc.jp/)

### 技術リソース
- [Mastra Documentation](https://mastra.ai/docs)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Anthropic Claude](https://www.anthropic.com/claude)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [viem Documentation](https://viem.sh/)
- [Next.js 15 Documentation](https://nextjs.org/docs)

### ブロックチェーンエクスプローラー
- [Ethereum Sepolia](https://sepolia.etherscan.io/address/0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB)
- [Avalanche Fuji](https://testnet.snowtrace.io/address/0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB)

---

## 📌 重要な注意事項

### 現在の対応状況

このプロジェクトは現在、**JPYC Prepaid** (`0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB`) に対応しています。

**対応チェーン**:
- ✅ **Ethereum Sepolia** (推奨・動作確認済み)
- ✅ **Avalanche Fuji** (動作確認済み)
- ⚠️ Polygon Amoy（コントラクト未デプロイのため未対応）

### プロジェクト構成の特徴

このプロジェクトは **pnpm ワークスペース** によるモノレポ構成です：

- **`pkgs/frontend`**: Next.js 15 + Mastra + MCP Client
- **`pkgs/mcp`**: 独立したMCPサーバー（HTTP/SSE）
- **`pkgs/jpyc-sdk`**: JPYC SDK（git submodule）

この構成により、フロントエンドとバックエンドを分離し、保守性と再利用性を向上させています。

### Git Submoduleについて

現在、資金移動業版のSDKが公開準備中のため、このプロジェクトでは JPYC SDK を **git submodule** として組み込んでいます。

### JPYC（資金移動業版）について

**間もなく公開予定**の JPYC（資金移動業版）では、以下のアドレスが使用されます:
- **新アドレス**: `0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29`
- **コントラクトの変更**: なし（ABIは同じ）
- **移行方法**: アドレスを変更するだけで対応可能

**JPYCでの対応チェーン**:
- ✅ Ethereum Sepolia
- ✅ Polygon Amoy（Faucet公開後に対応）
- ✅ Avalanche Fuji

### JPYCへの移行手順

JPYC（資金移動業版）が公開されたら、以下の手順で移行してください:

1. **コントラクトアドレスを変更** (`pkgs/mcp/src/jpyc/sdk.ts`)
   ```typescript
   const JPYC_CONTRACT_ADDRESS: Hex = '0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29';
   ```

2. **（Polygon Amoy対応時）チェーン設定を追加** (`pkgs/mcp/src/jpyc/sdk.ts`)
   - Polygon Amoyの設定を追加

3. **AIエージェントの説明を更新** (`pkgs/frontend/src/lib/mastra/agent.ts`)
   - 対応テストネットにPolygon Amoyが利用可能であることを明記

4. **動作確認**
   - 各テストネットで残高照会・送信をテスト