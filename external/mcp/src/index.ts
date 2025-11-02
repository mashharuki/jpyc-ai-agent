/**
 * JPYC MCP Server - Standalone MCP Server
 * 
 * このサーバーはJPYC SDKの機能をMCPプロトコル経由で公開します。
 * HTTP/SSEを使用して、MCPClientから接続できるようにします。
 * 
 * 学習用ポイント:
 * 1. MCPServerを独立したプロセスとして実行
 * 2. HTTP/SSE経由でMCPClientと通信
 * 3. 実際のMCPプロトコルの使い方を学習
 */

import { MCPServer } from "@mastra/mcp";
import http from "node:http";
import { jpycTools } from "./tools";

const PORT = process.env.MCP_PORT || 3001;

/**
 * JPYC MCP Server インスタンス
 */
const server = new MCPServer({
  name: "jpyc-sdk",
  version: "1.0.0",
  tools: jpycTools,
});

/**
 * HTTPサーバーを作成してMCPServerを統合
 */
const httpServer = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // CORSヘッダーを設定（Next.jsアプリからのアクセスを許可）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // ヘルスチェックエンドポイント
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", server: "jpyc-mcp-server" }));
    return;
  }

  // MCP SSEエンドポイント
  try {
    await server.startSSE({
      url: new URL(req.url || "", `http://localhost:${PORT}`),
      ssePath: "/sse",
      messagePath: "/message",
      req,
      res,
    });
  } catch (error) {
    console.error("MCP Server error:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

// サーバー起動
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🚀 JPYC MCP Server is running!                   ║
║                                                            ║
║  SSE Endpoint:     http://localhost:${PORT}/sse               ║
║  Message Endpoint: http://localhost:${PORT}/message           ║
║  Health Check:     http://localhost:${PORT}/health            ║
║                                                            ║
║  Available Tools:                                          ║
║    - jpyc_balance           (残高照会)                     ║
║    - jpyc_transfer          (送金)                         ║
║    - jpyc_switch_chain      (チェーン切り替え)             ║
║    - jpyc_get_current_chain (現在のチェーン取得)           ║
║    - jpyc_total_supply      (総供給量照会)                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// エラーハンドリング
httpServer.on("error", (error) => {
  console.error("HTTP Server error:", error);
  process.exit(1);
});

// graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
