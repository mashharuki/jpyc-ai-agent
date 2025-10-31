'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentChainName, setCurrentChainName] = useState<string>('Loading...');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが更新されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 現在のチェーンを取得
  useEffect(() => {
    const fetchCurrentChain = async () => {
      try {
        const response = await fetch('/api/chain');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setCurrentChainName(data.chainName);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Failed to fetch current chain:', error);
        // エラー時はデフォルト値を設定
        setCurrentChainName('Ethereum Sepolia');
      }
    };

    // 初回取得
    fetchCurrentChain();

    // メッセージが更新されたときもチェーンを再取得（チェーン切り替えを反映）
    const interval = setInterval(fetchCurrentChain, 3000);
    return () => clearInterval(interval);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConversationId(data.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ エラー: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-gray-900">JPYC AI Agent</h1>
        <div className="text-sm text-gray-600">
          {currentChainName}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 こんにちは！</p>
            <p>JPYCの送金や残高照会をお手伝いします。</p>
            <div className="mt-4 text-sm space-y-1">
              <p className="font-semibold mb-2">チェーン切り替え:</p>
              <p>例: 「Sepoliaに切り替えて」</p>
              <p>例: 「Amoyで実行して」</p>
              <p>例: 「Avalancheに変更」</p>
              <p className="font-semibold mt-3 mb-2">操作:</p>
              <p>例: 「0x123...に10JPYC送って」</p>
              <p>例: 「残高を教えて」</p>
              <p>例: 「総供給量は?」</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none text-gray-900">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                      strong: ({ node, ...props }) => <strong {...props} className="font-bold" />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString('ja-JP')}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-gray-600">考え中...</p>
            </div>
          </div>
        )}

        {/* 自動スクロール用の要素 */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="メッセージを入力..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          送信
        </button>
      </div>
    </div>
  );
}
