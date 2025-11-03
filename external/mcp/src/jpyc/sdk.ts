import { JPYC, type IJPYC, SdkClient, type ISdkClient } from "@jpyc/sdk-core";
import type { Hex } from "viem";
import type { PrivateKeyAccount } from "viem/accounts";

// サポートするチェーン
export type SupportedChain = "sepolia" | "amoy" | "fuji";

// JPYC SDKで使用するチェーンIDのマッピング
const CHAIN_ID_MAP: Record<SupportedChain, number> = {
	sepolia: 11155111, // Ethereum Sepolia
	amoy: 80002, // Polygon Amoy
	fuji: 43113, // Avalanche Fuji
};

const CHAIN_NAMES: Record<SupportedChain, string> = {
	sepolia: "Ethereum Sepolia",
	amoy: "Polygon Amoy",
	fuji: "Avalanche Fuji",
};

// チェーンごとのRPC URL
const RPC_URLS: Record<SupportedChain, string> = {
	sepolia: "https://ethereum-sepolia-rpc.publicnode.com",
	amoy: "https://rpc-amoy.polygon.technology",
	fuji: "https://api.avax-test.network/ext/bc/C/rpc",
};

// 現在選択されているチェーン（デフォルトはSepolia）
let _currentChain: SupportedChain = "sepolia";
let _jpycInstance: IJPYC | null = null;
let _account: PrivateKeyAccount | null = null;

/**
 * JPYC SDKインスタンスを生成するメソッド
 * @param chain
 */
function createJpycInstance(chain: SupportedChain) {
	// 環境変数の検証
	if (!process.env.PRIVATE_KEY) {
		throw new Error("PRIVATE_KEY environment variable is required");
	}

	const chainId = CHAIN_ID_MAP[chain];

	// SdkClientの初期化
	const sdkClient: ISdkClient = new SdkClient({
		chainId,
		rpcUrl: RPC_URLS[chain],
	});

	// アカウントの作成
	_account = sdkClient.configurePrivateKeyAccount({
		privateKey: process.env.PRIVATE_KEY as Hex,
	});

	// Clientの生成
	const client = sdkClient.configureClient({
		account: _account,
	});

	// JPYC SDKインスタンスの作成
	_jpycInstance = new JPYC({
		env: "prod",
		contractType: "jpycPrepaid",
		localContractAddress: undefined,
		client,
	});
}

/**
 * JPYC SDKインスタンスを取得するメソッド
 * @returns
 */
function getJpycInstance(): IJPYC {
	if (!_jpycInstance) {
		createJpycInstance(_currentChain);
	}
	return _jpycInstance!;
}

/**
 * チェーンを切り替える関数
 * @param chain
 */
export function switchChain(chain: SupportedChain): void {
	if (!CHAIN_ID_MAP[chain]) {
		throw new Error(
			`Unsupported chain: ${chain}. Supported chains: sepolia, amoy, fuji`,
		);
	}
	_currentChain = chain;
	// JPYC SDKインスタンスを再作成
	createJpycInstance(chain);
}

/**
 * 現在のチェーンを取得する関数
 * @returns
 */
export function getCurrentChain(): SupportedChain {
	return _currentChain;
}

/**
 * チェーンの表示名を取得する関数
 * @param chain
 * @returns
 */
export function getChainName(chain?: SupportedChain): string {
	const targetChain = chain || _currentChain;
	return CHAIN_NAMES[targetChain] || "Ethereum Sepolia";
}

/**
 * 現在のアカウントアドレスを取得する関数
 * @returns
 */
export function getCurrentAddress(): Hex {
	if (!_account) {
		// アカウントが未初期化の場合、JPYC SDKインスタンスを初期化
		getJpycInstance();
	}
	return _account!.address;
}

/**
 * JPYC操作インターフェース（JPYC SDKを使用）
 */
export const jpyc = {
	/**
	 * 総供給量を取得するメソッド
	 * @returns
	 */
	async totalSupply(): Promise<string> {
		try {
			const jpycInstance = getJpycInstance();
			// JPYC SDKのtotalSupply関数を呼び出す
			const result = await jpycInstance.totalSupply();
			// numberをstringに変換して返す
			return result.toString();
		} catch (error: any) {
			console.error("[jpyc.totalSupply] Error:", error);

			// コントラクトが存在しない場合のエラーハンドリング
			if (
				error.message?.includes("returned no data") ||
				error.message?.includes("0x")
			) {
				const chainName = getChainName(_currentChain);
				throw new Error(
					`JPYCコントラクトが${chainName}にデプロイされていないか、アドレスが正しくありません。` +
						`Ethereum Sepoliaでお試しください。`,
				);
			}

			throw new Error(`Failed to get total supply: ${error.message}`);
		}
	},

	/**
	 * JPYCの残高を取得するメソッド
	 * @param params
	 * @returns
	 */
	async balanceOf(params: { account: Hex }): Promise<string> {
		try {
			const jpycInstance = getJpycInstance();
			// JPYC SDKのbalanceOf関数を呼び出す
			const result = await jpycInstance.balanceOf({ account: params.account });
			// numberをstringに変換して返す
			return result.toString();
		} catch (error: any) {
			console.error("[jpyc.balanceOf] Error:", error);

			// コントラクトが存在しない場合のエラーハンドリング
			if (
				error.message?.includes("returned no data") ||
				error.message?.includes("0x")
			) {
				const chainName = getChainName(_currentChain);
				throw new Error(
					`JPYCコントラクトが${chainName}にデプロイされていないか、アドレスが正しくありません。` +
						`現在のチェーンを確認してください。`,
				);
			}

			throw new Error(`Failed to get balance: ${error.message}`);
		}
	},

	/**
	 * JPYCを送金するメソッド
	 * @param params
	 * @returns
	 */
	async transfer(params: { to: Hex; value: number }): Promise<string> {
		try {
			const jpycInstance = getJpycInstance();
			// JPYC SDKのtransfer関数を呼び出す
			// SDKはnumberを受け取り、内部で適切に変換する
			const hash = await jpycInstance.transfer({
				to: params.to,
				value: params.value,
			});

			return hash;
		} catch (error: any) {
			console.error("[jpyc.transfer] Error:", error);
			throw new Error(`Failed to transfer: ${error.message}`);
		}
	},
};
