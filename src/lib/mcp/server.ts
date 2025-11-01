/**
 * JPYC MCP Server
 * 
 * JPYC SDKの機能をMCPツールとして提供するサーバー
 * Mastraエージェントから利用可能な標準MCPサーバー実装
 * 
 * 学習用: MCPServerとMCPClientの正しい使い方を示す実装例
 */

import { jpycTools } from "@/lib/mastra/tools";
import { MCPServer } from "@mastra/mcp";

/**
 * JPYC MCP Server
 * 
 * 提供ツール:
 * - jpyc_balance: JPYC残高照会
 * - jpyc_transfer: JPYC送金
 * - jpyc_switch_chain: チェーン切り替え
 * - jpyc_get_current_chain: 現在のチェーン取得
 * - jpyc_total_supply: 総供給量照会
 * 
 * MCPServerは、createToolで定義したツールをMCPプロトコル経由で公開します。
 * MCPClientから接続することで、リモートツールとして利用できます。
 */
export const jpycMCPServer = new MCPServer({
  name: "jpyc-sdk",
  version: "1.0.0",
  tools: jpycTools,
});

