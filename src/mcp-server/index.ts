import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { transferTool } from './tools/transfer';
import { balanceTool } from './tools/balance';
import { totalSupplyTool } from './tools/totalSupply';
import { switchChainTool } from './tools/switchChain';
import { getCurrentChainTool } from './tools/getCurrentChain';

const tools = [
  switchChainTool,
  getCurrentChainTool,
  transferTool,
  balanceTool,
  totalSupplyTool,
];

const server = new Server(
  {
    name: 'jpyc-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧取得
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// ツール実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);

  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const result = await tool.execute(request.params.arguments);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('JPYC MCP Server running on stdio');
}

main().catch(console.error);
