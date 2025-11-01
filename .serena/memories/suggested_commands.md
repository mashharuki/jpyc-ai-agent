# 推奨コマンド一覧

## パッケージ管理

### Git Submodule
```bash
# Submoduleの初期化・更新
git submodule update --init --recursive

# クローン時にSubmoduleも取得
git clone --recurse-submodules <repository-url>
```

### 依存関係のインストール
```bash
# 通常のインストール
pnpm install

# JPYC SDKのビルドも含む（本番ビルド前に必要）
pnpm --filter @jpyc/sdk-core compile && pnpm install
```

## 開発サーバー

### 起動
```bash
pnpm dev
```
- 開発サーバーが起動（デフォルト: http://localhost:3000）
- ホットリロード有効

## ビルド・本番環境

### ビルド
```bash
pnpm build
```
- JPYC SDKのコンパイル → 依存関係インストール → Next.jsビルド

### 本番サーバー起動
```bash
pnpm start
```
- ビルド済みアプリケーションを本番モードで起動

## コード品質チェック

### リント
```bash
pnpm lint
```
- Next.js標準のESLintルールでチェック

### フォーマット
```bash
pnpm format
```
- Biomeでコード整形（タブインデント、ダブルクォート）

## 環境設定

### 環境変数ファイル作成
```bash
cp .env.local.example .env.local
```

必須の環境変数:
- `PRIVATE_KEY`: テストネット用秘密鍵
- `OPENAI_API_KEY`: OpenAI APIキー

## macOS (Darwin) システムコマンド

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
```
