import { jpyc, getCurrentChain, getChainName } from '@/lib/jpyc/sdk';
import { TotalSupplySchema } from '../types';

export const totalSupplyTool = {
  name: 'jpyc_total_supply',
  description: 'JPYCトークンの総供給量を照会します（現在選択されているテストネット）',
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },

  async execute(params: unknown) {
    try {
      const validated = TotalSupplySchema.parse(params);
      const currentChain = getCurrentChain();
      const chainName = getChainName(currentChain);
      const supplyString = await jpyc.totalSupply();

      return {
        success: true,
        totalSupply: `${supplyString} JPYC`,
        totalSupplyRaw: supplyString,
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
