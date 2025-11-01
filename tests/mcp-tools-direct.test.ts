/**
 * JPYC MCP Server 直接テスト
 * 
 * MCPサーバーから取得したツールを直接呼び出して検証
 */

// 環境変数を読み込み
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { getCurrentAddress, getCurrentChain, switchChain } from "@/lib/jpyc/sdk";
import { jpycMCPServer } from "@/mcp-server";

// テスト用の色付きログ
const log = {
	success: (msg: string) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`),
	error: (msg: string) => console.log(`\x1b[31m✗ ${msg}\x1b[0m`),
	info: (msg: string) => console.log(`\x1b[36mℹ ${msg}\x1b[0m`),
	test: (msg: string) => console.log(`\n\x1b[33m▶ ${msg}\x1b[0m`),
};

// テスト結果の集計
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * アサーション関数
 */
function assert(condition: boolean, message: string) {
	totalTests++;
	if (condition) {
		passedTests++;
		log.success(message);
	} else {
		failedTests++;
		log.error(message);
		throw new Error(`Assertion failed: ${message}`);
	}
}

function assertEqual<T>(actual: T, expected: T, message: string) {
	assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
}

/**
 * メインテスト関数
 */
async function runTests() {
	console.log("\x1b[1m\x1b[35m");
	console.log("╔════════════════════════════════════════════════════════╗");
	console.log("║     JPYC MCP Tools Direct Test Suite                 ║");
	console.log("╚════════════════════════════════════════════════════════╝");
	console.log("\x1b[0m");

	// MCPサーバーからツールを取得
	const mcpTools = jpycMCPServer.originalTools;
	
	try {
		// ========================================
		// Test 1: ツール定義の確認
		// ========================================
		log.test("Test 1: ツール定義の確認");
		
		assert(mcpTools.jpyc_balance !== undefined, "jpyc_balanceが定義されている");
		assert(mcpTools.jpyc_get_current_chain !== undefined, "jpyc_get_current_chainが定義されている");
		assert(mcpTools.jpyc_switch_chain !== undefined, "jpyc_switch_chainが定義されている");
		assert(mcpTools.jpyc_total_supply !== undefined, "jpyc_total_supplyが定義されている");
		assert(mcpTools.jpyc_transfer !== undefined, "jpyc_transferが定義されている");
		
		const toolCount = Object.keys(mcpTools).length;
		assertEqual(toolCount, 5, "5つのツールが登録されている");

		// ========================================
		// Test 2: 現在のチェーン取得
		// ========================================
		log.test("Test 2: 現在のチェーン取得 (jpyc_get_current_chain)");
		
		const currentChainResult = await mcpTools.jpyc_get_current_chain.execute({ context: { args: {} } });
		log.info(`Result: ${JSON.stringify(currentChainResult, null, 2)}`);
		
		assert(currentChainResult.success === true, "成功レスポンスを返す");
		assert(currentChainResult.chain !== undefined, "チェーン情報が含まれる");
		assert(currentChainResult.chainName !== undefined, "チェーン名が含まれる");
		assert(currentChainResult.address !== undefined, "アドレスが含まれる");
		assert(
			["sepolia", "amoy", "fuji"].includes(currentChainResult.chain),
			"サポートされているチェーンである"
		);

		const initialChain = currentChainResult.chain;
		log.info(`初期チェーン: ${currentChainResult.chainName} (${initialChain})`);

		// ========================================
		// Test 3: チェーン切り替え (Sepolia)
		// ========================================
		log.test("Test 3: チェーン切り替え - Sepolia (jpyc_switch_chain)");
		
		const switchSepoliaResult = await mcpTools.jpyc_switch_chain.execute({ 
			context: { args: { chain: "sepolia" } } 
		});
		log.info(`Result: ${JSON.stringify(switchSepoliaResult, null, 2)}`);
		
		assert(switchSepoliaResult.success === true, "成功レスポンスを返す");
		assertEqual(switchSepoliaResult.newChain, "sepolia", "Sepoliaに切り替わっている");
		assert(switchSepoliaResult.chainName !== undefined, "チェーン名が含まれる");
		
		// 実際に切り替わったか確認
		const verifyChain = getCurrentChain();
		assertEqual(verifyChain, "sepolia", "実際にSepoliaに切り替わっている");

		// ========================================
		// Test 4: 残高照会（アドレス指定なし）
		// ========================================
		log.test("Test 4: 残高照会 - 自分のアドレス (jpyc_balance)");
		
		const balanceSelfResult = await mcpTools.jpyc_balance.execute({ context: { args: {} } });
		log.info(`Result: ${JSON.stringify(balanceSelfResult, null, 2)}`);
		
		assert(balanceSelfResult.success === true, "成功レスポンスを返す");
		assert(balanceSelfResult.address !== undefined, "アドレスが含まれる");
		assert(balanceSelfResult.balance !== undefined, "残高が含まれる");
		assert(balanceSelfResult.balanceRaw !== undefined, "生の残高値が含まれる");
		assertEqual(balanceSelfResult.chain, "sepolia", "Sepoliaチェーンの残高");
		
		const selfAddress = getCurrentAddress();
		assertEqual(balanceSelfResult.address, selfAddress, "自分のアドレスの残高を取得");

		// ========================================
		// Test 5: 残高照会（アドレス指定あり）
		// ========================================
		log.test("Test 5: 残高照会 - 特定アドレス (jpyc_balance)");
		
		// 自分のアドレスを使ってテスト（実際に存在するアドレス）
		const testAddress = selfAddress;
		const balanceSpecificResult = await mcpTools.jpyc_balance.execute({ 
			context: { args: { address: testAddress } } 
		});
		log.info(`Result: ${JSON.stringify(balanceSpecificResult, null, 2)}`);
		
		assert(balanceSpecificResult.success === true, "成功レスポンスを返す");
		assertEqual(balanceSpecificResult.address, testAddress, "指定したアドレスの残高を取得");
		assert(balanceSpecificResult.balance !== undefined, "残高が含まれる");

		// ========================================
		// Test 6: 総供給量照会
		// ========================================
		log.test("Test 6: 総供給量照会 (jpyc_total_supply)");
		
		const totalSupplyResult = await mcpTools.jpyc_total_supply.execute({ context: { args: {} } });
		log.info(`Result: ${JSON.stringify(totalSupplyResult, null, 2)}`);
		
		assert(totalSupplyResult.success === true, "成功レスポンスを返す");
		assert(totalSupplyResult.totalSupply !== undefined, "総供給量が含まれる");
		assert(totalSupplyResult.totalSupplyRaw !== undefined, "生の総供給量値が含まれる");
		assertEqual(totalSupplyResult.chain, "sepolia", "Sepoliaチェーンの総供給量");
		
		// 総供給量が数値として解析可能か確認
		const supplyValue = Number.parseFloat(totalSupplyResult.totalSupplyRaw);
		assert(!Number.isNaN(supplyValue) && supplyValue > 0, "総供給量が正の数値である");

		// ========================================
		// Test 7: チェーン切り替え (Fuji)
		// ========================================
		log.test("Test 7: チェーン切り替え - Fuji (jpyc_switch_chain)");
		
		const switchFujiResult = await mcpTools.jpyc_switch_chain.execute({ 
			context: { args: { chain: "fuji" } } 
		});
		log.info(`Result: ${JSON.stringify(switchFujiResult, null, 2)}`);
		
		assert(switchFujiResult.success === true, "成功レスポンスを返す");
		assertEqual(switchFujiResult.newChain, "fuji", "Fujiに切り替わっている");
		assertEqual(switchFujiResult.previousChain, "sepolia", "以前はSepoliaだった");
		
		// 実際に切り替わったか確認
		const verifyFuji = getCurrentChain();
		assertEqual(verifyFuji, "fuji", "実際にFujiに切り替わっている");

		// ========================================
		// Test 8: 異なるチェーンでの残高照会
		// ========================================
		log.test("Test 8: Fujiチェーンでの残高照会 (jpyc_balance)");
		
		const balanceFujiResult = await mcpTools.jpyc_balance.execute({ context: { args: {} } });
		log.info(`Result: ${JSON.stringify(balanceFujiResult, null, 2)}`);
		
		assert(balanceFujiResult.success === true, "成功レスポンスを返す");
		assertEqual(balanceFujiResult.chain, "fuji", "Fujiチェーンの残高");
		assert(balanceFujiResult.balance !== undefined, "残高が含まれる");

		// ========================================
		// Test 9: 送金ツールのパラメータ検証
		// ========================================
		log.test("Test 9: 送金ツールのパラメータ検証 (jpyc_transfer)");
		
		const transferTool = mcpTools.jpyc_transfer;
		assert(transferTool !== undefined, "送金ツールが存在する");
		assert(transferTool.description !== undefined, "送金ツールに説明がある");
		assert(transferTool.parameters !== undefined, "送金ツールにパラメータ定義がある");
		
		const schema = transferTool.parameters;
		log.info(`送金ツールのスキーマ keys: ${Object.keys(schema.shape || {}).join(", ")}`);
		assert(schema.shape?.to !== undefined, "toパラメータが定義されている");
		assert(schema.shape?.amount !== undefined, "amountパラメータが定義されている");
		
		log.info("⚠️  注意: 実際の送金テストはガス代がかかるためスキップしました");

		// ========================================
		// Test 10: エラーハンドリング（無効なアドレス）
		// ========================================
		log.test("Test 10: エラーハンドリング - 無効なアドレス");
		
		const invalidAddressResult = await mcpTools.jpyc_balance.execute({ 
			context: { args: { address: "invalid_address" } } 
		});
		log.info(`Result: ${JSON.stringify(invalidAddressResult, null, 2)}`);
		
		assert(invalidAddressResult.success === false, "無効なアドレスでエラーを返す");
		assert(invalidAddressResult.error !== undefined, "エラーメッセージが含まれる");

		// ========================================
		// 元のチェーンに戻す
		// ========================================
		if (initialChain !== getCurrentChain()) {
			log.info(`テスト後のクリーンアップ: ${initialChain}に戻します`);
			await switchChain(initialChain);
		}

	} catch (error) {
		log.error(`テスト実行中にエラーが発生: ${error instanceof Error ? error.message : String(error)}`);
		if (error instanceof Error && error.stack) {
			console.error(error.stack);
		}
	}

	// ========================================
	// テスト結果サマリー
	// ========================================
	console.log("\n\x1b[1m\x1b[35m");
	console.log("╔════════════════════════════════════════════════════════╗");
	console.log("║                  Test Summary                          ║");
	console.log("╚════════════════════════════════════════════════════════╝");
	console.log("\x1b[0m");
	
	console.log(`Total Tests: ${totalTests}`);
	console.log(`\x1b[32mPassed: ${passedTests}\x1b[0m`);
	console.log(`\x1b[31mFailed: ${failedTests}\x1b[0m`);
	console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
	
	if (failedTests === 0) {
		console.log("\n\x1b[1m\x1b[32m🎉 All tests passed! 🎉\x1b[0m\n");
		process.exit(0);
	} else {
		console.log("\n\x1b[1m\x1b[31m❌ Some tests failed ❌\x1b[0m\n");
		process.exit(1);
	}
}

// テスト実行
runTests().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
