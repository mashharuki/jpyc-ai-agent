import { MCPClient } from "@mastra/mcp";

/**
 * JPYC MCPサーバーを呼び出すためのMCPクライアント
 */
export const jpycMCPClient = new MCPClient({
	servers: {
		// JPYC MCPサーバーのURLを設定する(MCPサーバー事前に起動しておくこと)
		"jpyc:mcp-server": {
			url: new URL(
				process.env.JPYC_MCP_SERVER_URL || "http://localhost:3001/sse",
			),
		},
	},
});
