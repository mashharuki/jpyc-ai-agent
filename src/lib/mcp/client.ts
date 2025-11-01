/**
 * JPYC MCP Client
 * 
 * ローカルMCPサーバー(自分自身)のツールをMCPClient経由で利用
 * 
 * 学習用ポイント:
 * 1. MCPClientは複数のMCPサーバーに接続できる
 * 2. getTools()でMCPサーバーのツールを取得
 * 3. エージェントにツールを渡して利用
 * 
 * このパターンは、リモートMCPサーバーに接続する場合と同じように動作します。
 * ローカルツールでも、MCPプロトコルを経由することで学習目的を果たせます。
 */

import { jpycMCPServer } from "@/lib/mcp/server";

/**
 * JPYC MCP Client
 * 
 * 学習用: MCPClientの基本的な使い方を示す例
 * 
 * 通常、MCPClientは以下のようにリモートサーバーに接続します:
 * ```typescript
 * const mcp = new MCPClient({
 *   servers: {
 *     weather: {
 *       url: new URL("http://localhost:8080/sse"),
 *     },
 *     stocks: {
 *       command: "npx",
 *       args: ["tsx", "stock-server.ts"],
 *     },
 *   },
 * });
 * ```
 * 
 * この例では、学習目的で既存のMCPServerインスタンスを
 * 直接参照していますが、実際のプロダクション環境では
 * HTTP/SSE経由でリモートサーバーに接続することが一般的です。
 */
export const jpycMCPClient = {
  /**
   * MCPサーバーのツールを取得
   * 
   * 学習ポイント: 
   * - MCPClientのgetTools()メソッドは、接続されているすべてのMCPサーバーのツールを返します
   * - ツールは名前空間化されて返される場合があります (例: "serverName.toolName")
   */
  getTools: async () => {
    // 学習用: MCPServerから直接ツールを取得
    // 実際のMCPClientは、HTTP/SSE経由でツールのメタデータを取得します
    const tools = jpycMCPServer.tools;
    
    if (typeof tools === 'function') {
      return await tools();
    }
    
    return tools;
  },
  
  /**
   * 接続解除 (学習用placeholder)
   * 
   * 実際のMCPClientでは、接続を閉じる処理が必要です
   */
  disconnect: async () => {
    // 学習用: 実際には何もしない
    console.log('MCP Client: disconnect (学習用実装)');
  },
};

/**
 * 学習メモ:
 * 
 * ## MCPの役割
 * - MCPServer: ツールを提供する側(サーバー)
 * - MCPClient: ツールを利用する側(クライアント)
 * - エージェント: MCPClientから取得したツールを使って推論・実行
 * 
 * ## 本格的なMCP実装では
 * 1. MCPServerをHTTP/SSEエンドポイントで公開
 * 2. MCPClientがHTTP/SSE経由で接続
 * 3. プロトコルに従ってツール情報を交換
 * 4. ツール実行もMCP経由で行う
 * 
 * ## この実装の限界
 * - ローカル参照のため、リモート接続の学習にはならない
 * - プロトコルレベルの通信は発生しない
 * - ただし、アーキテクチャの概念は理解できる
 */
