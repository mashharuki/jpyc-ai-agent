/**
 * JPYC MCP Server
 * 
 * JPYC SDKの機能をMCPツールとして提供するサーバー
 * Mastraエージェントから利用可能な標準MCPサーバー実装
 */

import {
  getChainName,
  getCurrentAddress,
  getCurrentChain,
  jpyc,
  type SupportedChain,
  switchChain,
} from "@/lib/jpyc/sdk";
import { MCPServer } from "@mastra/mcp";
import { z } from "zod";

// エクスプローラーURLマッピング
const EXPLORER_URLS: Record<SupportedChain, string> = {
	sepolia: "https://sepolia.etherscan.io/tx/",
	amoy: "https://amoy.polygonscan.com/tx/",
	fuji: "https://testnet.snowtrace.io/tx/",
};

/**
 * JPYC MCP Server
 * 
 * 提供ツール:
 * - jpyc_balance: JPYC残高照会
 * - jpyc_transfer: JPYC送金
 * - jpyc_switch_chain: チェーン切り替え
 * - jpyc_get_current_chain: 現在のチェーン取得
 * - jpyc_total_supply: 総供給量照会
 */
export const jpycMCPServer = new MCPServer({
	name: "jpyc-sdk",
	version: "1.0.0",
	tools: {
		// 残高照会ツール
		jpyc_balance: {
			description:
				"指定したアドレスのJPYC残高を照会します（現在選択されているテストネット）。アドレスが指定されていない場合は、現在のウォレットアドレスの残高を返します。",
			parameters: z.object({
				address: z
					.string()
					.optional()
					.describe("残高を照会するEthereumアドレス（省略時は現在のウォレットアドレス）"),
			}),
			execute: async ({ context }: { context: { args: unknown } }) => {
				try {
					const { address } = context.args as { address?: string };
					const currentChain = getCurrentChain();
					const chainName = getChainName(currentChain);

					// アドレスが指定されていない場合は、現在のアカウントアドレスを使用
					const targetAddress = address || getCurrentAddress();
					const balanceString = await jpyc.balanceOf({
						account: targetAddress as `0x${string}`,
					});

          console.log(`jpyc_balance: address=${targetAddress}, balance=${balanceString} JPYC`);

					return {
						success: true,
						address: targetAddress,
						balance: `${balanceString} JPYC`,
						balanceRaw: balanceString,
						chain: currentChain,
						chainName: chainName,
					};
				} catch (error: unknown) {
					return {
						success: false,
						error: error instanceof Error ? error.message : String(error),
					};
				}
			},
		},

		// 送金ツール
		jpyc_transfer: {
			description:
				"JPYCトークンを指定したアドレスに送金します（現在選択されているテストネット）。例: 10 JPYCを0x123...に送る",
			parameters: z.object({
				to: z.string().describe("送信先のEthereumアドレス (0xから始まる42文字)"),
				amount: z.number().describe("送金額（JPYC単位、例: 10）"),
			}),
			execute: async ({ context }: { context: { args: unknown } }) => {
				try {
					const { to, amount } = context.args as { to: string; amount: number };
					const currentChain = getCurrentChain();
					const chainName = getChainName(currentChain);

					const txHash = await jpyc.transfer({
						to: to as `0x${string}`,
						value: amount,
					});

					const explorerUrl = EXPLORER_URLS[currentChain];

					return {
						success: true,
						message: `✅ ${amount} JPYCを ${to} に送金しました（${chainName}）`,
						transactionHash: txHash,
						explorerUrl: `${explorerUrl}${txHash}`,
						chain: currentChain,
						chainName: chainName,
					};
				} catch (error: unknown) {
					return {
						success: false,
						error: error instanceof Error ? error.message : String(error),
					};
				}
			},
		},

		// チェーン切り替えツール
		jpyc_switch_chain: {
			description:
				"JPYCを操作するテストネットを切り替えます。対応チェーン: sepolia (Ethereum), amoy (Polygon), fuji (Avalanche)。ユーザーが「Sepoliaで」「Amoyに切り替えて」「Avalancheで実行」などと言った場合に使用します。",
			parameters: z.object({
				chain: z
					.enum(["sepolia", "amoy", "fuji"])
					.describe(
						"切り替え先のチェーン: sepolia (Ethereum Sepolia), amoy (Polygon Amoy), fuji (Avalanche Fuji)",
					),
			}),
			execute: async ({ context }: { context: { args: unknown } }) => {
				try {
					const { chain } = context.args as { chain: SupportedChain };
					const previousChain = getCurrentChain();

					await switchChain(chain);

					const newChainName = getChainName(chain);
					const previousChainName = getChainName(previousChain);

					return {
						success: true,
						message: `✅ チェーンを ${previousChainName} から ${newChainName} に切り替えました`,
						previousChain: previousChain,
						newChain: chain,
						chainName: newChainName,
					};
				} catch (error: unknown) {
					return {
						success: false,
						error: error instanceof Error ? error.message : String(error),
					};
				}
			},
		},

		// 現在のチェーン取得ツール
		jpyc_get_current_chain: {
			description:
				"現在選択されているテストネットを取得します。ユーザーが「今どのチェーン？」「現在のネットワークは？」などと聞いた場合に使用します。",
			parameters: z.object({}),
			execute: async () => {
				try {
					const currentChain = getCurrentChain();
					const chainName = getChainName(currentChain);

					return {
						success: true,
						chain: currentChain,
						chainName: chainName,
						address: getCurrentAddress(),
					};
				} catch (error: unknown) {
					return {
						success: false,
						error: error instanceof Error ? error.message : String(error),
					};
				}
			},
		},

		// 総供給量照会ツール
		jpyc_total_supply: {
			description:
				"現在選択されているテストネットでのJPYCの総供給量を照会します。ユーザーが「総供給量は？」「流通量を教えて」などと聞いた場合に使用します。",
			parameters: z.object({}),
			execute: async () => {
				try {
					const currentChain = getCurrentChain();
					const chainName = getChainName(currentChain);
					const totalSupply = await jpyc.totalSupply();

					return {
						success: true,
						totalSupply: `${totalSupply} JPYC`,
						totalSupplyRaw: totalSupply,
						chain: currentChain,
						chainName: chainName,
					};
				} catch (error: unknown) {
					return {
						success: false,
						error: error instanceof Error ? error.message : String(error),
					};
				}
			},
		},
	},
});
