# 既知の問題（Known Issues）

## Polygon Amoyでの残高取得・流通量取得エラー

### 問題

Polygon Amoyテストネットで残高照会や総供給量照会を実行すると、以下のエラーが発生します：

```
The contract function "balanceOf" returned no data ("0x").
```

### 原因

JPYCコントラクト（アドレス: `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB`）が、Polygon Amoyテストネットにデプロイされていない可能性があります。

### 確認方法

各テストネットでコントラクトが存在するか確認する方法：

#### 1. Ethereum Sepolia
```bash
curl -X POST https://ethereum-sepolia-rpc.publicnode.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB","latest"],"id":1}'
```

**期待される結果**: `0x`以外のコード（コントラクトバイトコード）が返される

#### 2. Polygon Amoy
```bash
curl -X POST https://rpc-amoy.polygon.technology \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB","latest"],"id":1}'
```

**実際の結果**: `{"jsonrpc":"2.0","id":1,"result":"0x"}` → コントラクトが存在しない

#### 3. Avalanche Fuji
```bash
curl -X POST https://api.avax-test.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB","latest"],"id":1}'
```

**確認が必要**

### 解決策

#### オプション1: Ethereum Sepoliaのみを使用

現時点では、**Ethereum Sepolia**でのみJPYCコントラクトが確実に動作します。

```typescript
// ユーザーに推奨チェーンを明示
// src/lib/mastra/agent.ts

対応テストネット: Ethereum Sepolia (推奨), Polygon Amoy (未確認), Avalanche Fuji (未確認)
デフォルトチェーン: Ethereum Sepolia
```

#### オプション2: 各チェーンごとに異なるコントラクトアドレスを使用

もし各テストネットに異なるアドレスでJPYCコントラクトがデプロイされている場合、以下のように設定を変更します：

```typescript
// src/lib/jpyc/sdk.ts

// チェーンごとのJPYCコントラクトアドレス
const JPYC_CONTRACT_ADDRESSES: Record<SupportedChain, Hex> = {
  sepolia: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB',
  amoy: '0x...', // Polygon Amoyの実際のアドレス
  fuji: '0x...', // Avalanche Fujiの実際のアドレス
};

// コントラクトアドレスを動的に取得
function getContractAddress(): Hex {
  return JPYC_CONTRACT_ADDRESSES[_currentChain];
}
```

#### オプション3: JPYCをPolygon Amoyにデプロイ

JPYC SDKの開発者に連絡して、Polygon AmoyとAvalanche FujiにもJPYCコントラクトをデプロイしてもらう。

### 現在の実装

エラーハンドリングを改善し、ユーザーにわかりやすいメッセージを表示するようにしました：

```typescript
// コントラクトが存在しない場合のエラーメッセージ
if (error.message?.includes('returned no data') || error.message?.includes('0x')) {
  const chainName = getChainName(_currentChain);
  throw new Error(
    `JPYCコントラクトが${chainName}にデプロイされていないか、アドレスが正しくありません。` +
    `Ethereum Sepoliaでお試しください。`
  );
}
```

### 推奨アクション

1. **短期的**: Ethereum Sepoliaのみを使用するようにドキュメントを更新
2. **中期的**: Polygon AmoyとAvalanche Fujiでコントラクトアドレスを確認
3. **長期的**: 各チェーンに正しくデプロイされたコントラクトアドレスを設定

### 参考リンク

- [JPYC SDK GitHub](https://github.com/jcam1/sdks)
- [Ethereum Sepolia Explorer](https://sepolia.etherscan.io/address/0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB)
- [Polygon Amoy Explorer](https://amoy.polygonscan.com/address/0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB)
- [Avalanche Fuji Explorer](https://testnet.snowtrace.io/address/0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB)
