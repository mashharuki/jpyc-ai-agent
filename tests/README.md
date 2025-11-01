# JPYC MCP Server テストスイート

JPYC SDKの機能をMCP化したツールの動作を検証するためのユニットテストです。

## テストファイル

### 1. `mcp-tools-direct.test.ts` ⭐️ 推奨

MCPサーバーから取得したツールを直接呼び出して検証します。

```bash
pnpm run test:tools
```

**テスト内容:**
- ✅ Test 1: ツール定義の確認（5つのツールが正しく登録されているか）
- ✅ Test 2: 現在のチェーン取得 (`jpyc_get_current_chain`)
- ✅ Test 3: チェーン切り替え - Sepolia (`jpyc_switch_chain`)
- ✅ Test 4: 残高照会 - 自分のアドレス (`jpyc_balance`)
- ✅ Test 5: 残高照会 - 特定アドレス (`jpyc_balance`)
- ✅ Test 6: 総供給量照会 (`jpyc_total_supply`)
- ✅ Test 7: チェーン切り替え - Fuji (`jpyc_switch_chain`)
- ✅ Test 8: Fujiチェーンでの残高照会 (`jpyc_balance`)
- ✅ Test 9: 送金ツールのパラメータ検証 (`jpyc_transfer`)
- ✅ Test 10: エラーハンドリング - 無効なアドレス

### 2. `mcp-server.test.ts`

MCPサーバーの内部APIを通してツールを検証します（Mastraの型定義の制約あり）。

```bash
pnpm run test:mcp
```

## 前提条件

テスト実行前に以下を確認してください:

### 1. 環境変数の設定

`.env.local` ファイルに以下の環境変数が設定されている必要があります:

```bash
PRIVATE_KEY=0x... # テストネット用の秘密鍵
OPENAI_API_KEY=sk-proj-... # OpenAI APIキー（テストでは使用しませんが、インポート時に必要）
```

### 2. 依存パッケージのインストール

```bash
pnpm install
```

## テスト結果の見方

### 成功時

```
╔════════════════════════════════════════════════════════╗
║     JPYC MCP Tools Direct Test Suite                 ║
╚════════════════════════════════════════════════════════╝

▶ Test 1: ツール定義の確認
✓ jpyc_balanceが定義されている
✓ jpyc_get_current_chainが定義されている
...

╔════════════════════════════════════════════════════════╗
║                  Test Summary                          ║
╚════════════════════════════════════════════════════════╝

Total Tests: 43
Passed: 43
Failed: 0
Success Rate: 100.00%

🎉 All tests passed! 🎉
```

### 失敗時

失敗したテストは `✗` マークで表示され、エラーメッセージと共に詳細が出力されます。

## テストの特徴

### 自動クリーンアップ

- テスト終了時に自動的に初期チェーン状態に戻します
- 他のテストやアプリケーションに影響を与えません

### 実際のブロックチェーン操作

- Sepolia と Fuji テストネット上で実際にトランザクションを読み取ります
- 送金機能はガス代がかかるため、パラメータ検証のみ実施

### エラーハンドリング検証

- 無効なアドレスなどの異常系も適切にエラーを返すことを確認

## トラブルシューティング

### エラー: "PRIVATE_KEY environment variable is required"

`.env.local` ファイルに `PRIVATE_KEY` が設定されていません。

```bash
# .env.local
PRIVATE_KEY=0x...
```

### エラー: "Cannot find module '@/mcp-server'"

TypeScriptのパスエイリアスが解決できていません。プロジェクトルートから実行してください:

```bash
cd /path/to/jpyc-ai-agent
pnpm run test:tools
```

### テストが途中で止まる

ネットワークの問題でブロックチェーンへのアクセスが遅延している可能性があります。
インターネット接続を確認してください。

## テストの拡張

新しいMCPツールを追加した場合は、以下の手順でテストを追加してください:

1. `tests/mcp-tools-direct.test.ts` を開く
2. Test 1のツール存在確認に新しいツールを追加
3. 新しいテストケースを追加（Test 11以降）
4. `pnpm run test:tools` で動作確認

## CI/CDへの統合

GitHub Actionsなどでテストを自動実行する場合:

```yaml
- name: Run MCP Tests
  env:
    PRIVATE_KEY: ${{ secrets.TEST_PRIVATE_KEY }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: pnpm run test:tools
```

## 参考

- [Mastra MCP Documentation](https://mastra.ai/docs/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [JPYC SDK Documentation](../external/jpyc-sdk/README.md)
