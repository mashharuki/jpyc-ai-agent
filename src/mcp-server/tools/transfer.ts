import { jpyc, getCurrentChain, getChainName, type SupportedChain } from '@/lib/jpyc/sdk';
import { TransferSchema } from '../types';

// チェーンごとのExplorer URL
const EXPLORER_URLS: Record<SupportedChain, string> = {
  sepolia: 'https://sepolia.etherscan.io/tx/',
  amoy: 'https://amoy.polygonscan.com/tx/',
  fuji: 'https://testnet.snowtrace.io/tx/',
};

export const transferTool = {
  name: 'jpyc_transfer',
  description: 'JPYCトークンを指定したアドレスに送金します（現在選択されているテストネット）。例: 10 JPYCを0x123...に送る',
  inputSchema: {
    type: 'object' as const,
    properties: {
      to: {
        type: 'string',
        description: '送信先のEthereumアドレス (0xから始まる42文字)',
      },
      amount: {
        type: 'number',
        description: '送金額（JPYC単位、例: 10）',
      },
    },
    required: ['to', 'amount'],
  },

  async execute(params: unknown) {
    try {
      const validated = TransferSchema.parse(params);
      const currentChain = getCurrentChain();
      const chainName = getChainName(currentChain);

      const txHash = await jpyc.transfer({
        to: validated.to as `0x${string}`,
        value: validated.amount
      });

      const explorerUrl = EXPLORER_URLS[currentChain];

      return {
        success: true,
        message: `✅ ${validated.amount} JPYCを ${validated.to} に送金しました（${chainName}）`,
        transactionHash: txHash,
        explorerUrl: `${explorerUrl}${txHash}`,
        chain: currentChain,
        chainName: chainName,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
