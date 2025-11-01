import {
	jpyc,
	getCurrentChain,
	getChainName,
	getCurrentAddress,
} from "@/lib/jpyc/sdk";
import { BalanceSchema } from "../types";

export const balanceTool = {
	name: "jpyc_balance",
	description:
		"指定したアドレスのJPYC残高を照会します（現在選択されているテストネット）。アドレスが指定されていない場合は、現在のウォレットアドレスの残高を返します。",
	inputSchema: {
		type: "object" as const,
		properties: {
			address: {
				type: "string",
				description:
					"残高を照会するEthereumアドレス（省略時は現在のウォレットアドレス）",
			},
		},
		required: [],
	},

	async execute(params: unknown) {
		try {
			const validated = BalanceSchema.parse(params);
			const currentChain = getCurrentChain();
			const chainName = getChainName(currentChain);

			// アドレスが指定されていない場合は、現在のアカウントアドレスを使用
			const targetAddress = validated.address || getCurrentAddress();
			const balanceString = await jpyc.balanceOf({
				account: targetAddress as `0x${string}`,
			});

			return {
				success: true,
				address: targetAddress,
				balance: `${balanceString} JPYC`,
				balanceRaw: balanceString,
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
