import { getCurrentChain, getChainName } from '@/lib/jpyc/sdk';

export const getCurrentChainTool = {
  name: 'jpyc_get_current_chain',
  description: '現在選択されているテストネットを取得します',
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },

  async execute() {
    try {
      const currentChain = getCurrentChain();
      const chainName = getChainName(currentChain);

      return {
        success: true,
        currentChain: currentChain,
        chainName: chainName,
        message: `現在のチェーン: ${chainName}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
