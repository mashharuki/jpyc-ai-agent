import { createWalletClient, createPublicClient, http, type Hex, type Chain, formatUnits, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, polygonAmoy, avalancheFuji } from 'viem/chains';
import { JPYC } from '@jpyc/sdk-core';

// ERC20 ABI（必要な関数のみ）
const ERC20_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// サポートするチェーン
export type SupportedChain = 'sepolia' | 'amoy' | 'fuji';

const CHAIN_MAP: Record<SupportedChain, Chain> = {
  sepolia: sepolia,
  amoy: polygonAmoy,
  fuji: avalancheFuji,
};

const CHAIN_NAMES: Record<SupportedChain, string> = {
  sepolia: 'Ethereum Sepolia',
  amoy: 'Polygon Amoy',
  fuji: 'Avalanche Fuji',
};

// チェーンごとのRPC URL
const RPC_URLS: Record<SupportedChain, string> = {
  sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
  amoy: 'https://rpc-amoy.polygon.technology',
  fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
};

// JPYCコントラクトアドレス（全テストネット共通）
const JPYC_CONTRACT_ADDRESS: Hex = '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB';

// 現在選択されているチェーン（デフォルトはSepolia）
let _currentChain: SupportedChain = 'sepolia';
let _jpycInstance: JPYC | null = null;
let _account: ReturnType<typeof privateKeyToAccount> | null = null;
let _publicClient: ReturnType<typeof createPublicClient> | null = null;
let _walletClient: ReturnType<typeof createWalletClient> | null = null;

function createClients(chain: SupportedChain) {
  // 環境変数の検証
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // アカウントの作成（初回のみ）
  if (!_account) {
    _account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
  }

  // PublicClientの作成（読み取り専用操作用）
  _publicClient = createPublicClient({
    chain: CHAIN_MAP[chain],
    transport: http(RPC_URLS[chain]),
  });

  // WalletClientの作成（トランザクション送信用）
  _walletClient = createWalletClient({
    account: _account,
    chain: CHAIN_MAP[chain],
    transport: http(RPC_URLS[chain]),
  });

  // JPYC SDKインスタンスの作成（送金用に保持）
  _jpycInstance = new JPYC({ client: _walletClient });
}

function getPublicClient() {
  if (!_publicClient) {
    createClients(_currentChain);
  }
  return _publicClient!;
}

function getWalletClient() {
  if (!_walletClient) {
    createClients(_currentChain);
  }
  return _walletClient!;
}

function getJPYCInstance(): JPYC {
  if (!_jpycInstance) {
    createClients(_currentChain);
  }
  return _jpycInstance!;
}

// チェーンを切り替える関数
export function switchChain(chain: SupportedChain): void {
  if (!CHAIN_MAP[chain]) {
    throw new Error(`Unsupported chain: ${chain}. Supported chains: sepolia, amoy, fuji`);
  }
  _currentChain = chain;
  // クライアントを再作成
  createClients(chain);
}

// 現在のチェーンを取得
export function getCurrentChain(): SupportedChain {
  return _currentChain;
}

// チェーンの表示名を取得
export function getChainName(chain?: SupportedChain): string {
  const targetChain = chain || _currentChain;
  return CHAIN_NAMES[targetChain] || 'Ethereum Sepolia';
}

// 現在のアカウントアドレスを取得
export function getCurrentAddress(): Hex {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }
  if (!_account) {
    _account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
  }
  return _account.address;
}

// JPYC操作インターフェース（viemで直接実装）
export const jpyc = {
  async totalSupply(): Promise<string> {
    try {
      const publicClient = getPublicClient();
      const result = await publicClient.readContract({
        address: JPYC_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      });
      // BigIntを18桁の小数点フォーマットに変換
      return formatUnits(result, 18);
    } catch (error: any) {
      console.error('[jpyc.totalSupply] Error:', error);

      // コントラクトが存在しない場合のエラーハンドリング
      if (error.message?.includes('returned no data') || error.message?.includes('0x')) {
        const chainName = getChainName(_currentChain);
        throw new Error(
          `JPYCコントラクトが${chainName}にデプロイされていないか、アドレスが正しくありません。` +
          `Ethereum Sepoliaでお試しください。`
        );
      }

      throw new Error(`Failed to get total supply: ${error.message}`);
    }
  },

  async balanceOf(params: { account: Hex }): Promise<string> {
    try {
      const publicClient = getPublicClient();
      const result = await publicClient.readContract({
        address: JPYC_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [params.account],
      });
      // BigIntを18桁の小数点フォーマットに変換
      return formatUnits(result, 18);
    } catch (error: any) {
      console.error('[jpyc.balanceOf] Error:', error);

      // コントラクトが存在しない場合のエラーハンドリング
      if (error.message?.includes('returned no data') || error.message?.includes('0x')) {
        const chainName = getChainName(_currentChain);
        throw new Error(
          `JPYCコントラクトが${chainName}にデプロイされていないか、アドレスが正しくありません。` +
          `現在のチェーンを確認してください。`
        );
      }

      throw new Error(`Failed to get balance: ${error.message}`);
    }
  },

  async transfer(params: { to: Hex; value: number }): Promise<string> {
    try {
      const walletClient = getWalletClient();

      if (!walletClient.account) {
        throw new Error('Wallet client account is not initialized');
      }

      // numberを18桁のBigIntに変換
      const amount = parseUnits(params.value.toString(), 18);

      // walletClient.accountを使用（既にアカウント情報を持っている）
      const hash = await walletClient.writeContract({
        address: JPYC_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [params.to, amount],
        account: walletClient.account,
        chain: CHAIN_MAP[_currentChain],
      });

      return hash;
    } catch (error: any) {
      console.error('[jpyc.transfer] Error:', error);
      throw new Error(`Failed to transfer: ${error.message}`);
    }
  },
};
