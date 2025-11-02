# コーディング規約とスタイル

## コーディング規約（AGENTS.mdより）

### 基本方針
- わかりやすくて自然な日本語で回答を出力
- 品質・保守性・安全性を常に意識
- ボーイスカウトルール：コードを見つけた時よりも良い状態で残す

### エラーハンドリング
- エラーの抑制（@ts-ignore、try-catch握りつぶし）ではなく、根本原因を修正
- 早期にエラーを検出し、明確なエラーメッセージを提供
- 外部APIやネットワーク通信は必ず失敗する可能性を考慮

### コード品質
- DRY原則：重複を避ける
- 意味のある変数名・関数名で意図を明確に伝える
- コメントは「なぜ」を説明し、「何を」はコードで表現
- 小さな問題も放置せず、発見次第修正

### セキュリティ
- APIキー、秘密鍵等は環境変数で管理（ハードコード禁止）
- すべての外部入力を検証
- 必要最小限の権限で動作

## TypeScript設定

### tsconfig.json
- strict mode有効
- target: ES2017
- module: esnext
- moduleResolution: bundler
- パスエイリアス: `@/*` → `./src/*`

## フォーマッター・リンター

### Biome (biome.json)
- **インデント**: タブ
- **クォート**: ダブルクォート
- **インポート整理**: 自動（on save）
- VCS統合: Git
- Linter: 推奨ルール有効

### ESLint
- Next.js標準設定（next/core-web-vitals）を継承

## 命名規則（コードから推測）
- 変数/関数: camelCase
- 定数: UPPER_SNAKE_CASE
- 型/インターフェース: PascalCase
- プライベート変数: `_` プレフィックス（例: `_account`, `_currentChain`）

## ファイル構成パターン
- ツール定義: `src/mcp-server/tools/` 配下に機能別ファイル
- SDK操作: `src/lib/jpyc/sdk.ts` に集約
- エージェント定義: `src/lib/mastra/agent.ts`
- ストレージ: `src/lib/storage/` でローカルストレージ抽象化
