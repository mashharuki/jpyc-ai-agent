import {
	switchChain,
	getCurrentChain,
	getChainName,
	type SupportedChain,
} from "@/lib/jpyc/sdk";
import { z } from "zod";

const SwitchChainSchema = z.object({
	chain: z.enum(["sepolia", "amoy", "fuji"]),
});

export const switchChainTool = {
	name: "jpyc_switch_chain",
	description:
		"JPYCを操作するテストネットを切り替えます。対応チェーン: sepolia (Ethereum), amoy (Polygon), fuji (Avalanche)。ユーザーが「Sepoliaで」「Amoyに切り替えて」「Avalancheで実行」などと言った場合に使用します。",
	inputSchema: {
		type: "object" as const,
		properties: {
			chain: {
				type: "string",
				enum: ["sepolia", "amoy", "fuji"],
				description: "切り替え先のチェーン (sepolia, amoy, fuji)",
			},
		},
		required: ["chain"],
	},

	async execute(params: unknown) {
		try {
			const validated = SwitchChainSchema.parse(params);
			const previousChain = getCurrentChain();
			const previousChainName = getChainName(previousChain);

			switchChain(validated.chain as SupportedChain);
			const newChainName = getChainName(validated.chain as SupportedChain);

			return {
				success: true,
				message: `✅ チェーンを ${previousChainName} から ${newChainName} に切り替えました`,
				previousChain: previousChain,
				currentChain: validated.chain,
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
			};
		}
	},
};
