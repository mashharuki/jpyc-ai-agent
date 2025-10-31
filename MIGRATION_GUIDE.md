# JPYC v2（資金移動業版）への移行ガイド

## 現在の状況

### 使用中のコントラクト
- **JPYC Prepaid**: `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB`
- 対応チェーン: Ethereum Sepolia, Avalanche Fuji

### 今後公開予定のコントラクト
- **JPYC v2（資金移動業版）**: `0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29`
- 対応予定チェーン: Ethereum Sepolia, Polygon Amoy, Avalanche Fuji

### 重要な注意事項
- コントラクト自体に変更はない（ABIは同じ）
- アドレスを変更するだけで移行可能
- 現在、資金移動業版のSDKは公開準備中（間もなく公開予定）
- Polygon Amoyは資金移動業版のFaucetが公開された後に対応可能

---

## 移行に必要な変更箇所

### 必須変更（2箇所）

#### 1. コントラクトアドレスの変更

**ファイル**: `src/lib/jpyc/sdk.ts`

```typescript
// 現在（JPYC Prepaid）
const JPYC_CONTRACT_ADDRESS: Hex = '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB';

// 変更後（JPYC v2 資金移動業版）
const JPYC_CONTRACT_ADDRESS: Hex = '0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29';
```

#### 2. AIエージェントの指示を更新（Polygon Amoy対応時）

**ファイル**: `src/lib/mastra/agent.ts`

```typescript
// 現在
対応テストネット: Ethereum Sepolia, Avalanche Fuji
デフォルトチェーン: Ethereum Sepolia

// 変更後（Polygon Amoy Faucet公開後）
対応テストネット: Ethereum Sepolia, Polygon Amoy, Avalanche Fuji
デフォルトチェーン: Ethereum Sepolia

注: Polygon AmoyはJPYC v2（資金移動業版）で利用可能です
```

### 推奨変更（ドキュメント更新）

#### 3. README.mdの更新

**ファイル**: `README.md`

対応チェーンの表を更新:

```markdown
| チェーン | ステータス | 備考 |
|---------|-----------|------|
| Ethereum Sepolia | ✅ 動作確認済み | JPYC v2対応 |
| Polygon Amoy | ✅ 動作確認済み | JPYC v2対応（Faucet公開後） |
| Avalanche Fuji | ✅ 動作確認済み | JPYC v2対応 |
```

#### 4. KNOWN_ISSUES.mdの更新

Polygon Amoyの問題セクションを削除または更新。

---

## 移行手順

### ステップ1: JPYC v2 SDKの公開を待つ

現在、JPYC v2（資金移動業版）のSDKは公開準備中です。公開されたら、git submoduleを更新します。

```bash
cd external/jpyc-sdk
git checkout main  # または指定されたブランチ
git pull origin main
cd ../..
git add external/jpyc-sdk
git commit -m "Update JPYC SDK to v2 (資金移動業版)"
```

### ステップ2: コントラクトアドレスを変更

`src/lib/jpyc/sdk.ts` を編集:

```typescript
- const JPYC_CONTRACT_ADDRESS: Hex = '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB';
+ const JPYC_CONTRACT_ADDRESS: Hex = '0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29';
```

### ステップ3: テスト

各テストネットで動作確認:

```bash
pnpm dev
```

1. Ethereum Sepoliaで残高照会
2. Avalanche Fujiに切り替えて残高照会
3. （Faucet公開後）Polygon Amoyに切り替えて残高照会

### ステップ4: Polygon Amoy対応（Faucet公開後）

Polygon Amoy用のFaucetが公開されたら、以下を確認:

1. Faucetでテストトークンを取得
2. Polygon Amoyで残高照会が正常に動作するか確認
3. 送金テストを実行

---

## その他の確認事項

### ABIの互換性確認

コントラクトABIに変更がないことを確認:

**現在のABI** (`src/lib/jpyc/sdk.ts`):
```typescript
const ERC20_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
```

JPYC v2で同じABIが使用されていることを確認してください。

### エクスプローラーURLの確認

**ファイル**: `src/mcp-server/tools/transfer.ts`

エクスプローラーURLは変更不要:

```typescript
const EXPLORER_URLS: Record<SupportedChain, string> = {
  sepolia: 'https://sepolia.etherscan.io/tx/',
  amoy: 'https://amoy.polygonscan.com/tx/',
  fuji: 'https://testnet.snowtrace.io/tx/',
};
```

### RPC URLの確認

**ファイル**: `src/lib/jpyc/sdk.ts`

RPC URLは変更不要:

```typescript
const RPC_URLS: Record<SupportedChain, string> = {
  sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
  amoy: 'https://rpc-amoy.polygon.technology',
  fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
};
```

---

## トラブルシューティング

### Q: コントラクトアドレスを変更したが、エラーが出る

**A**: 以下を確認:
1. 新しいアドレスが正しくデプロイされているか
2. 各テストネットで同じアドレスが使用されているか
3. ブラウザのキャッシュをクリア
4. 開発サーバーを再起動

### Q: Polygon Amoyでまだエラーが出る

**A**:
- Polygon Amoy用のFaucetが公開されているか確認
- コントラクトがPolygon Amoyにデプロイされているか確認
- エクスプローラーで確認: `https://amoy.polygonscan.com/address/0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29`

---

## チェックリスト

移行時に以下を確認してください:

- [ ] JPYC v2 SDKが公開されている
- [ ] git submoduleを最新版に更新
- [ ] `src/lib/jpyc/sdk.ts` のコントラクトアドレスを変更
- [ ] Ethereum Sepoliaで動作確認
- [ ] Avalanche Fujiで動作確認
- [ ] （Faucet公開後）Polygon Amoyで動作確認
- [ ] `src/lib/mastra/agent.ts` の説明を更新（必要に応じて）
- [ ] README.mdを更新
- [ ] KNOWN_ISSUES.mdを更新

---

## 参考情報

- **JPYC Prepaidアドレス**: `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB`
- **JPYC v2アドレス**: `0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29`
- **JPYC SDK GitHub**: https://github.com/jcam1/sdks
- **JPYC公式サイト**: https://jpyc.jp/

---

## まとめ

JPYC v2（資金移動業版）への移行は、主に **コントラクトアドレスの変更（1箇所）** のみで完了します。

コントラクト自体に変更がないため、ABIやその他のコードは変更不要です。

Polygon Amoyは、資金移動業版のFaucetが公開された時点で自動的に対応可能になります。
