// @ts-nocheck - Mastra 0.23.3のAPI変更により型定義が異なるため
import { Agent } from '@mastra/core';
import { createOpenAI } from '@ai-sdk/openai';

import { switchChainTool } from '@/mcp-server/tools/switchChain';
import { getCurrentChainTool } from '@/mcp-server/tools/getCurrentChain';
import { transferTool } from '@/mcp-server/tools/transfer';
import { balanceTool } from '@/mcp-server/tools/balance';
import { totalSupplyTool } from '@/mcp-server/tools/totalSupply';

// Mastra用のOpenAIプロバイダーを作成
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// gpt-4o-miniモデルを使用（安価で高速、推論トークンなし）
const gpt4oMiniModel = openai('gpt-4o-mini');

export const jpycAgent = new Agent({
  name: 'JPYC Assistant',
  description: 'JPYCトークンの操作をサポートするAIアシスタント（マルチチェーン対応）',
  // @ts-ignore
  model: gpt4oMiniModel,
  tools: [
    {
      name: switchChainTool.name,
      description: switchChainTool.description,
      // @ts-ignore
      parameters: switchChainTool.inputSchema,
      execute: switchChainTool.execute,
    },
    {
      name: getCurrentChainTool.name,
      description: getCurrentChainTool.description,
      // @ts-ignore
      parameters: getCurrentChainTool.inputSchema,
      execute: getCurrentChainTool.execute,
    },
    {
      name: transferTool.name,
      description: transferTool.description,
      // @ts-ignore
      parameters: transferTool.inputSchema,
      execute: transferTool.execute,
    },
    {
      name: balanceTool.name,
      description: balanceTool.description,
      // @ts-ignore
      parameters: balanceTool.inputSchema,
      execute: balanceTool.execute,
    },
    {
      name: totalSupplyTool.name,
      description: totalSupplyTool.description,
      // @ts-ignore
      parameters: totalSupplyTool.inputSchema,
      execute: totalSupplyTool.execute,
    },
  ],
  instructions: `
あなたはJPYC（日本円ステーブルコイン）の操作をサポートするAIアシスタントです。

対応テストネット: Ethereum Sepolia, Avalanche Fuji
デフォルトチェーン: Ethereum Sepolia

以下の操作が可能です：
1. **チェーン切り替え**: テストネットを変更
2. **送金**: 指定したアドレスにJPYCを送金（現在選択中のチェーン）
3. **残高照会**: アドレスのJPYC残高を確認（現在選択中のチェーン、アドレス省略時は自分の残高）
4. **総供給量照会**: JPYCの総供給量を確認（現在選択中のチェーン）

ユーザーの自然言語の指示を解釈し、適切なツールを呼び出してください。

例:
- "Sepoliaに切り替えて" → jpyc_switch_chain (chain: "sepolia")
- "Amoyで実行して" → jpyc_switch_chain (chain: "amoy")
- "Avalancheに変更" → jpyc_switch_chain (chain: "fuji")
- "現在のチェーンは?" → jpyc_get_current_chain
- "0x123...に10JPYC送って" → jpyc_transfer
- "私の残高を教えて" または "残高教えて" → jpyc_balance (addressなし)
- "0x123...の残高を教えて" → jpyc_balance (address: "0x123...")
- "JPYCの総供給量は?" または "流通量教えて" → jpyc_total_supply
- "Amoyで0x123...に10JPYC送って" → まずjpyc_switch_chain、次にjpyc_transfer

## 重要な回答スタイル:
- **カジュアルで親しみやすい会話調で返答してください**
- 絵文字（💰、📊、✅など）は使わないでください
- 引用符（"""）やマークダウンの太字（**）は最小限にしてください
- チャットアプリのような自然な会話を心がけてください

## 回答例:
- **送金成功時**:
  「{to} に {amount} JPYC送りました！トランザクションは[こちらで確認]({explorerUrl})できます（{chainName}）」

- **残高照会時**:
  「{chainName}チェーンの残高は {balance} JPYC です」

- **総供給量照会時**:
  「現在の{chainName}での総供給量は {totalSupply} JPYC です」

- **チェーン切り替え時**:
  「{newChain} に切り替えました」

- **エラー時**:
  「エラーが発生しました: {errorMessage}」

重要:
- リンクは必ずマークダウン形式で表示してください（例: [こちらで確認](https://sepolia.etherscan.io/tx/0x...)）
- 数値は読みやすいように適宜カンマ区切りにしてください
  `.trim(),
});
