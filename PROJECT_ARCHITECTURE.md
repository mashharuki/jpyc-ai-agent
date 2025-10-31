# JPYC AI Agent - プロジェクトアーキテクチャ

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [ディレクトリ構造](#ディレクトリ構造)
3. [主要技術スタック](#主要技術スタック)
4. [Mastraとは](#mastraとは)
5. [MCPサーバーとは](#mcpサーバーとは)
6. [コードフロー詳細](#コードフロー詳細)
7. [データフロー図](#データフロー図)

---

## プロジェクト概要

このプロジェクトは、Next.js 15とMastraフレームワークを使用した、JPYC（日本円ステーブルコイン）を操作するAIエージェントアプリケーションです。

ユーザーは自然言語でチャット形式でJPYCトークンの操作（残高照会、送金、総供給量照会、チェーン切り替え）を行うことができます。

---

## ディレクトリ構造

```
jpyc-ai-agent/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/                # APIエンドポイント
│   │   │   ├── chat/          # チャット処理（Mastraエージェント）
│   │   │   └── chain/         # チェーン情報取得
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # ホームページ（チャットUI）
│   │   └── globals.css         # グローバルスタイル
│   ├── components/
│   │   └── ChatInterface.tsx   # チャットUI（フロントエンド）
│   ├── lib/
│   │   ├── jpyc/
│   │   │   └── sdk.ts          # JPYC SDK・viemラッパー（ブロックチェーン操作）
│   │   └── mastra/
│   │       └── agent.ts        # Mastraエージェント設定
│   └── mcp-server/
│       ├── tools/              # MCPツール定義（AIが呼び出す関数）
│       │   ├── balance.ts      # 残高照会ツール
│       │   ├── transfer.ts     # 送金ツール
│       │   ├── totalSupply.ts  # 総供給量照会ツール
│       │   ├── switchChain.ts  # チェーン切り替えツール
│       │   └── getCurrentChain.ts # 現在のチェーン取得ツール
│       └── types.ts            # Zodスキーマ定義
├── external/
│   └── jpyc-sdk/               # JPYC SDK（git submodule）
├── public/
│   └── demo_image.png          # デモ画像
├── .env.local                  # 環境変数（秘密鍵、APIキー）
├── package.json
├── tsconfig.json
└── README.md
```

---

## 主要技術スタック

### フロントエンド
- **Next.js 15** - React フレームワーク（App Router）
- **React 19** - UIライブラリ
- **TypeScript** - 型安全性
- **TailwindCSS** - スタイリング
- **react-markdown** - マークダウンレンダリング

### バックエンド/AI
- **Mastra 0.23.3** - AIエージェントフレームワーク
- **OpenAI GPT-4o-mini** - 自然言語処理
- **@ai-sdk/openai** - AI SDK（Mastra連携）
- **MCP (Model Context Protocol)** - AIツール呼び出しプロトコル

### ブロックチェーン
- **viem 2.x** - Ethereumライブラリ
- **JPYC SDK Core** - JPYC公式SDK（git submodule）
- **Ethereum Sepolia** - テストネット
- **Polygon Amoy** - テストネット（JPYC v2対応予定）
- **Avalanche Fuji** - テストネット

---

## Mastraとは

**Mastra**は、AIエージェントを構築するためのフレームワークです。

### 主な役割

1. **LLM統合**: OpenAI、Anthropicなどの大規模言語モデルを簡単に統合
2. **ツール管理**: AIが呼び出せる関数（ツール）を定義・管理
3. **会話管理**: ユーザーとAIの会話履歴を管理
4. **型安全性**: TypeScriptで完全な型サポート

### プロジェクトでの使用箇所

**ファイル**: `src/lib/mastra/agent.ts`

```typescript
import { Agent } from '@mastra/core';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const gpt4oMiniModel = openai('gpt-4o-mini');

export const jpycAgent = new Agent({
  name: 'JPYC Assistant',
  description: 'JPYCトークンの操作をサポートするAIアシスタント',
  model: gpt4oMiniModel,
  tools: [
    switchChainTool,      // チェーン切り替え
    getCurrentChainTool,  // 現在のチェーン取得
    transferTool,         // 送金
    balanceTool,          // 残高照会
    totalSupplyTool,      // 総供給量照会
  ],
  instructions: `
    あなたはJPYC（日本円ステーブルコイン）の操作をサポートするAIアシスタントです。
    ユーザーの自然言語の指示を解釈し、適切なツールを呼び出してください。
  `,
});
```

### Mastraの動作フロー

1. ユーザーがメッセージを送信
2. Mastraがメッセージを解釈
3. 必要なツール（関数）を自動選択
4. ツールを実行して結果を取得
5. 結果を自然言語で返答

---

## MCPサーバーとは

**MCP (Model Context Protocol)** は、AIエージェントが外部ツール（関数）を呼び出すための標準化されたプロトコルです。

### MCPの役割

1. **ツール定義**: AIが呼び出せる関数を定義
2. **パラメータ検証**: Zodスキーマで入力を検証
3. **エラーハンドリング**: 統一されたエラー処理
4. **ドキュメント化**: 各ツールの説明をAIに提供

### プロジェクトでの使用箇所

**ディレクトリ**: `src/mcp-server/tools/`

各ツールは以下の構造を持ちます：

```typescript
// 例: src/mcp-server/tools/balance.ts

export const balanceTool = {
  name: 'jpyc_balance',
  description: '指定したアドレスのJPYC残高を照会します',
  inputSchema: {
    type: 'object' as const,
    properties: {
      address: {
        type: 'string',
        description: '残高を照会するEthereumアドレス（省略時は現在のウォレット）',
      },
    },
    required: [],
  },
  async execute(params: unknown) {
    // パラメータ検証
    const validated = BalanceSchema.parse(params);

    // 実行ロジック
    const targetAddress = validated.address || getCurrentAddress();
    const balanceString = await jpyc.balanceOf({
      account: targetAddress as `0x${string}`
    });

    // 結果を返す
    return {
      success: true,
      balance: balanceString,
      address: targetAddress,
      chainName: getChainName(),
    };
  },
};
```

### MCP ツール一覧

| ツール名 | ファイル | 説明 |
|---------|---------|------|
| `jpyc_balance` | `balance.ts` | アドレスの残高を照会 |
| `jpyc_transfer` | `transfer.ts` | JPYCを送金 |
| `jpyc_total_supply` | `totalSupply.ts` | 総供給量を照会 |
| `jpyc_switch_chain` | `switchChain.ts` | チェーンを切り替え |
| `jpyc_get_current_chain` | `getCurrentChain.ts` | 現在のチェーンを取得 |

---

## コードフロー詳細

### ユーザーが「0x123...に100JPYC送って」と入力した場合のフロー

#### ステップ1: フロントエンド（ChatInterface.tsx）

```typescript
// ユーザーがメッセージを送信
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // メッセージを表示
  setMessages([...messages, { role: 'user', content: input }]);

  // APIにメッセージを送信
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: input,
      history: messages,
    }),
  });

  const data = await response.json();
  setMessages([...messages, data.message]);
};
```

**役割**: ユーザー入力を受け取り、APIに送信

---

#### ステップ2: APIルート（app/api/chat/route.ts）

```typescript
export async function POST(req: Request) {
  const body = await req.json();
  const { message, history } = body;

  // Mastraエージェントにメッセージを送信
  const response = await jpycAgent.generate(
    [
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ],
    { maxSteps: 5 }
  );

  return NextResponse.json({
    message: {
      role: 'assistant',
      content: response.text,
    },
  });
}
```

**役割**: リクエストを受け取り、Mastraエージェントに転送

---

#### ステップ3: Mastraエージェント（lib/mastra/agent.ts）

```typescript
export const jpycAgent = new Agent({
  model: gpt4oMiniModel,
  tools: [transferTool, balanceTool, ...],
  instructions: `
    ユーザーの自然言語の指示を解釈し、適切なツールを呼び出してください。
    例: "0x123...に10JPYC送って" → jpyc_transfer
  `,
});
```

**役割**:
1. ユーザーのメッセージを解釈（GPT-4o-mini使用）
2. 「送金」という意図を検出
3. `jpyc_transfer`ツールを選択
4. パラメータを抽出（to: "0x123...", amount: 100）
5. ツールを実行

---

#### ステップ4: MCPツール（mcp-server/tools/transfer.ts）

```typescript
export const transferTool = {
  name: 'jpyc_transfer',
  description: '指定したアドレスにJPYCを送金します',
  inputSchema: {
    type: 'object' as const,
    properties: {
      to: { type: 'string', description: '送金先アドレス' },
      amount: { type: 'number', description: '送金額（JPYC）' },
    },
    required: ['to', 'amount'],
  },
  async execute(params: unknown) {
    // 1. パラメータ検証
    const validated = TransferSchema.parse(params);

    // 2. SDK呼び出し
    const txHash = await jpyc.transfer({
      to: validated.to as `0x${string}`,
      value: validated.amount,
    });

    // 3. 結果を返す
    const currentChain = getCurrentChain();
    const explorerUrl = `${EXPLORER_URLS[currentChain]}${txHash}`;

    return {
      success: true,
      transactionHash: txHash,
      explorerUrl: explorerUrl,
      amount: validated.amount,
      to: validated.to,
      chainName: getChainName(currentChain),
    };
  },
};
```

**役割**:
1. 入力を検証（Zodスキーマ）
2. ブロックチェーン操作を実行
3. 結果をMastraに返す

---

#### ステップ5: JPYC SDK/viemラッパー（lib/jpyc/sdk.ts）

```typescript
export const jpyc = {
  async transfer(params: { to: Hex; value: number }): Promise<string> {
    const walletClient = getWalletClient();

    // 金額をBigIntに変換
    const amount = parseUnits(params.value.toString(), 18);

    // ERC20 transferを実行
    const hash = await walletClient.writeContract({
      address: JPYC_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [params.to, amount],
    });

    return hash;
  },
};
```

**役割**:
1. viemのWalletClientを取得
2. 金額をERC20フォーマット（18桁）に変換
3. ブロックチェーンにトランザクションを送信
4. トランザクションハッシュを返す

---

#### ステップ6: ブロックチェーン

```
1. viemがRPC経由でトランザクションを送信
   ↓
2. ウォレット（秘密鍵）でトランザクションに署名
   ↓
3. ブロックチェーンネットワークにブロードキャスト
   ↓
4. マイナーがトランザクションを処理
   ↓
5. トランザクションが承認される
```

**使用されるRPC URL**（`sdk.ts`で定義）:
- Ethereum Sepolia: `https://ethereum-sepolia-rpc.publicnode.com`
- Polygon Amoy: `https://rpc-amoy.polygon.technology`
- Avalanche Fuji: `https://api.avax-test.network/ext/bc/C/rpc`

---

### フロー全体のシーケンス図

```
ユーザー → ChatInterface → /api/chat → Mastraエージェント → MCPツール → JPYC SDK → ブロックチェーン
   ↑                                                                                        ↓
   └────────────────────────────────── 結果を返す ←─────────────────────────────────────────┘
```

---

## データフロー図

### 1. 送金フロー

```
[ユーザー入力]
  "0x123...に100JPYC送って"
        ↓
[ChatInterface.tsx]
  - メッセージを送信
        ↓
[/api/chat]
  - リクエストを受信
  - Mastraに転送
        ↓
[Mastraエージェント]
  - GPT-4o-miniで解釈
  - jpyc_transferツールを選択
  - パラメータ: { to: "0x123...", amount: 100 }
        ↓
[transferTool.execute()]
  - Zodで検証
  - jpyc.transfer()呼び出し
        ↓
[jpyc.transfer()]
  - WalletClient取得
  - parseUnits(100, 18) → BigInt変換
  - writeContract()実行
        ↓
[viem]
  - 秘密鍵で署名
  - RPC経由でトランザクション送信
        ↓
[ブロックチェーン]
  - トランザクション処理
  - txHashを返す
        ↓
[transferTool]
  - explorerURL生成
  - 結果をJSON形式で返す
        ↓
[Mastraエージェント]
  - 結果を自然言語に変換
  - "0x123... に 100 JPYC送りました！..."
        ↓
[/api/chat]
  - レスポンスをJSON形式で返す
        ↓
[ChatInterface.tsx]
  - メッセージを画面に表示
        ↓
[ユーザー]
  - 結果を確認
```

### 2. 残高照会フロー

```
[ユーザー入力]
  "残高教えて"
        ↓
[Mastraエージェント]
  - jpyc_balanceツールを選択
  - パラメータ: {} (addressなし)
        ↓
[balanceTool.execute()]
  - getCurrentAddress()で自分のアドレス取得
  - jpyc.balanceOf()呼び出し
        ↓
[jpyc.balanceOf()]
  - PublicClient取得
  - readContract('balanceOf')実行
        ↓
[viem]
  - RPC経由でコントラクト読み取り
        ↓
[ブロックチェーン]
  - balanceOf結果を返す（BigInt）
        ↓
[jpyc.balanceOf()]
  - formatUnits(result, 18) → 文字列変換
        ↓
[balanceTool]
  - 結果をJSON形式で返す
        ↓
[Mastraエージェント]
  - "Ethereum Sepoliaチェーンの残高は 1000.5 JPYC です"
        ↓
[ユーザー]
  - 結果を確認
```

### 3. チェーン切り替えフロー

```
[ユーザー入力]
  "Avalancheに切り替えて"
        ↓
[Mastraエージェント]
  - jpyc_switch_chainツールを選択
  - パラメータ: { chain: "fuji" }
        ↓
[switchChainTool.execute()]
  - switchChain('fuji')呼び出し
        ↓
[sdk.ts: switchChain()]
  - _currentChain = 'fuji'
  - createClients('fuji')
  - RPC URLを変更
  - WalletClient/PublicClient再作成
        ↓
[switchChainTool]
  - 成功メッセージを返す
        ↓
[Mastraエージェント]
  - "Avalanche Fuji に切り替えました"
        ↓
[ユーザー]
  - 以降の操作はAvalanche Fujiで実行される
```

---

## 主要コンポーネントの役割まとめ

| コンポーネント | 役割 | 技術 |
|--------------|------|-----|
| **ChatInterface.tsx** | ユーザーインターフェース | React, TailwindCSS |
| **/api/chat** | リクエストルーティング | Next.js API Routes |
| **Mastraエージェント** | 自然言語解釈・ツール選択 | Mastra, GPT-4o-mini |
| **MCPツール** | ブロックチェーン操作の抽象化 | MCP, Zod |
| **JPYC SDK/viemラッパー** | ブロックチェーン操作 | viem, JPYC SDK |
| **ブロックチェーン** | トランザクション処理 | Ethereum, Polygon, Avalanche |

---

## まとめ

このプロジェクトは、以下の技術を組み合わせて構築されています：

1. **フロントエンド**: Next.js 15 + React 19でモダンなチャットUI
2. **AI層**: Mastra + OpenAI GPT-4o-miniで自然言語処理
3. **ツール層**: MCP + Zodで型安全なブロックチェーン操作
4. **ブロックチェーン層**: viem + JPYC SDKで複数チェーン対応

ユーザーは「0x123...に100JPYC送って」のような自然言語でブロックチェーン操作を実行でき、AIが自動的に適切な関数を呼び出してトランザクションを処理します。
