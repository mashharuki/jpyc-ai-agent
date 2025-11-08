# 推奨コマンド一覧

## パッケージ管理

### Git Submodule
```bash
# Submoduleの初期化・更新
git submodule update --init --recursive

# クローン時にSubmoduleも取得
git clone --recurse-submodules <repository-url>

# Submoduleの最新版を取得
git submodule update --remote
```

### 依存関係のインストール
```bash
pnpm install
```
- モノレポ配下の全パッケージを一括でインストール

## 開発サーバー

### MCPサーバー起動（必須）
```bash
pnpm run mcp:dev
```
- MCPサーバーが起動（ポート3001）
- JPYC SDK操作用のMCPツールを提供
- **Next.jsアプリを起動する前に必ず起動すること**

### フロントエンド（Next.js）起動
```bash
pnpm --filter frontend dev
```
- http://localhost:3000 で開発サーバーが起動
- `pkgs/frontend` のみを対象にしたホットリロード

### 両方を同時に起動する場合
```bash
# ターミナル1
pnpm run mcp:dev

# ターミナル2
pnpm --filter frontend dev
```

## ビルド・本番環境

### ビルド
```bash
pnpm build
```
実行内容:
1. JPYC SDKのコンパイル (`@jpyc/sdk-core`)
2. MCPサーバーのビルド (`@jpyc/mcp-server`)
3. Next.jsアプリのビルド

### 本番サーバー起動
```bash
pnpm start
```
- ビルド済みアプリケーションを本番モードで起動

## コード品質チェック

### リント
```bash
pnpm --filter frontend lint
```
- Next.js標準ルール（App Router対応）でフロントエンドのみチェック

### フォーマット
```bash
pnpm format
```
- Biomeでコード整形（タブインデント、ダブルクォート）

## 環境設定

### 環境変数ファイル作成
```bash
cp .env.local.example .env.local
1. JPYC SDK Core のコンパイル (`@jpyc/sdk-core`)
2. MCPサーバーのビルド (`@jpyc/mcp-server`)
3. フロントエンドのビルド (`frontend`)
- `PRIVATE_KEY`: テストネット用秘密鍵（0xから始まる）
### 本番サーバー起動
```bash
# ターミナル1（MCPサーバー）
## デバッグ

# ターミナル2（Next.js）

```
- 事前に `pnpm build` を完了させておく
### MCPサーバーのログ確認
MCPサーバーを起動すると、以下のログが表示される:
```
╔════════════════════════════════════════════════════════════╗
║          🚀 JPYC MCP Server is running!                   ║
║  SSE Endpoint:     http://localhost:3001/sse               ║
║  Message Endpoint: http://localhost:3001/message           ║
║  Health Check:     http://localhost:3001/health            ║
╚════════════════════════════════════════════════════════════╝
```

### MCPサーバーのヘルスチェック
```bash
curl http://localhost:3001/health
```
期待される応答:
```json
{"status":"ok","server":"jpyc-mcp-server"}
```

### Next.jsアプリのログ確認
Next.jsの開発サーバーで以下をチェック:
- API呼び出しログ
- Mastraエージェントの動作
- MCPツールの呼び出し

## macOS (Darwin) システムコマンド

### ポート使用状況の確認
```bash
# 特定のポートをチェック
lsof -i :3000
lsof -i :3001

# ポートを使用しているプロセスを終了
kill -9 <PID>
```

### ファイル検索
```bash
# ファイル名で検索
find . -name "filename"

# 内容で検索
grep -r "pattern" .
```

### ディレクトリ操作
```bash
# リスト表示
ls -la

# ディレクトリ移動
cd /path/to/directory
```

### Git基本操作
```bash
# ステータス確認
git status

# コミット（コンベンショナルコミット形式）
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
git commit -m "refactor: improve code structure"
```

## トラブルシューティング

### MCPサーバーが起動しない
```bash
# ポート3001が使用されているか確認
lsof -i :3001

# 使用中なら停止
kill -9 <PID>

# 再起動
pnpm run mcp:dev
```

### ビルドエラー
```bash
# 依存関係を再インストール
rm -rf node_modules
pnpm install

# キャッシュをクリア
rm -rf .next

# 再ビルド
pnpm build
```

### JPYC SDKのエラー
```bash
# JPYC SDKを再コンパイル
cd external/jpyc-sdk/packages/core
pnpm compile

# ルートに戻って再インストール
cd ../../../..
pnpm install
```
