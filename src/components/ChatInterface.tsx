'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  getProfile,
  setProfile,
  deleteProfile,
  getFriends,
  addFriend,
  deleteFriend,
  type UserProfile,
  type Friend
} from '@/lib/storage/localStorage';

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
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [friends, setFriendsState] = useState<Friend[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [friendName, setFriendName] = useState('');
  const [friendAddress, setFriendAddress] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが更新されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // プロフィールと友達リストを読み込む
  useEffect(() => {
    setProfileState(getProfile());
    setFriendsState(getFriends());
  }, []);

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
          profile,
          friends,
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

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      alert('名前を入力してください');
      return;
    }

    try {
      // サーバーサイドからアドレスを取得
      const response = await fetch('/api/address');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const newProfile = setProfile(profileName, data.address);
      setProfileState(newProfile);
      setProfileName('');
      alert('プロフィールを保存しました');
    } catch (error: any) {
      alert(`エラー: ${error.message}`);
    }
  };

  const handleDeleteProfile = () => {
    if (confirm('プロフィールを削除しますか？')) {
      deleteProfile();
      setProfileState(null);
      alert('プロフィールを削除しました');
    }
  };

  const handleAddFriend = () => {
    if (!friendName.trim() || !friendAddress.trim()) {
      alert('名前とアドレスを入力してください');
      return;
    }

    try {
      const newFriend = addFriend(friendName, friendAddress as `0x${string}`);
      setFriendsState(getFriends());
      setFriendName('');
      setFriendAddress('');
      alert(`${newFriend.name}を友達リストに追加しました`);
    } catch (error: any) {
      alert(`エラー: ${error.message}`);
    }
  };

  const handleDeleteFriend = (id: string, name: string) => {
    if (confirm(`${name}を友達リストから削除しますか？`)) {
      deleteFriend(id);
      setFriendsState(getFriends());
      alert(`${name}を削除しました`);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-gray-900">JPYC AI Agent</h1>
        <div className="flex items-center gap-4">
          {profile && (
            <div className="text-sm text-gray-700">
              {profile.name}さん
            </div>
          )}
          <div className="text-sm text-gray-600">
            {currentChainName}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            {showSettings ? '閉じる' : '設定'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Profile Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">プロフィール</h2>
            {profile ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">名前:</span> {profile.name}
                </p>
                <p className="text-sm text-gray-700 break-all">
                  <span className="font-medium">アドレス:</span> {profile.address}
                </p>
                <button
                  onClick={handleDeleteProfile}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="あなたの名前"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            )}
          </div>

          {/* Friends Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">友達リスト</h2>
            <div className="space-y-3 mb-4">
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500">友達が登録されていません</p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex justify-between items-start p-3 bg-white rounded border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{friend.name}</p>
                      <p className="text-xs text-gray-600 break-all">{friend.address}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFriend(friend.id, friend.name)}
                      className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0"
                    >
                      削除
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="友達の名前"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <input
                type="text"
                value={friendAddress}
                onChange={(e) => setFriendAddress(e.target.value)}
                placeholder="0xから始まるアドレス"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <button
                onClick={handleAddFriend}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 こんにちは！</p>
            <p>JPYCの送金や残高照会をお手伝いします。</p>
            <div className="mt-4 text-sm space-y-1">
              <p className="font-semibold mb-2">まず設定ボタンから:</p>
              <p>・自分の名前を登録</p>
              <p>・友達のアドレスを登録</p>
              <p className="font-semibold mt-3 mb-2">チェーン切り替え:</p>
              <p>例: 「Sepoliaに切り替えて」</p>
              <p>例: 「Amoyで実行して」</p>
              <p>例: 「Avalancheに変更」</p>
              <p className="font-semibold mt-3 mb-2">操作:</p>
              <p>例: 「太郎に100JPYC送って」</p>
              <p>例: 「残高を教えて」</p>
              <p>例: 「太郎の残高教えて」</p>
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
              <div className="flex items-center gap-1 text-gray-600">
                <span>考え中</span>
                <span className="flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
              </div>
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
