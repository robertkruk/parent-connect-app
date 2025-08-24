import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { apiService } from '../services/api';
import { MessageStatus } from '../services/websocket';

interface RealtimeChatLayoutProps {
  currentUser: any;
  onLogout: () => void;
}

export function RealtimeChatLayout({ currentUser, onLogout }: RealtimeChatLayoutProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [users, setUsers] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    messageStatus,
    onlineUsers,
    typingUsers,
    isConnected,
    chats,
    selectedChat,
    addMessage,
    updateMessageStatus,
    setTypingIndicator,
    setUserOnline,
    setConnectionStatus,
    setChats,
    setSelectedChat,
    clearChatMessages,
    markMessageAsRead,
    initializeWebSocket,
    disconnectWebSocket,
    sendMessage,
    sendTypingIndicator
  } = useChatStore();

  // Initialize WebSocket connection
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const token = apiService.getToken();
        if (token) {
          await initializeWebSocket(token);
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        setError('Failed to connect to real-time service');
      }
    };

    initWebSocket();
    return () => disconnectWebSocket();
  }, [initializeWebSocket, disconnectWebSocket]);

  // Load chats and messages
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const apiChats = await apiService.getChats();
        setChats(apiChats as any);
        
        if (apiChats.length > 0) {
          setSelectedChat(apiChats[0] as any);
          // Clear existing messages for the initial chat
          clearChatMessages(apiChats[0].id);
          const chatMessages = await apiService.getMessages(apiChats[0].id);
          chatMessages.forEach(msg => {
            addMessage(apiChats[0].id, {
              id: msg.id,
              content: msg.content,
              senderId: msg.senderId,
              chatId: msg.chatId,
              type: msg.type,
              attachments: msg.attachments,
              replyTo: msg.replyTo,
              status: msg.status as any,
              createdAt: msg.createdAt,
              updatedAt: msg.updatedAt
            });
          });
        }
        
        const userNames = {
          '40e8b510-17bc-418e-894a-0d363f8758e7': 'Sarah Johnson',
          'a9836588-2316-4360-a670-ca306b5f3d57': 'Michael Chen', 
          '5daf3326-c042-4ad9-a53b-3baaed0533e5': 'Emily Rodriguez',
          '3b6873f7-a3b6-4773-b26d-6ba7c5d82b36': 'David Thompson',
          '162b123d-d09d-4e22-b061-19479110e5f6': 'Lisa Wang'
        };
        setUsers(userNames);
      } catch (error) {
        console.error('Error loading chat data:', error);
        setError('Failed to load chat data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [addMessage, setChats, setSelectedChat, clearChatMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  // Handle typing indicator
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping && selectedChat) {
      sendTypingIndicator(selectedChat.id, true);
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(selectedChat.id, false);
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, selectedChat, sendTypingIndicator]);

  const handleSendMessage = async () => {
    if (message.trim() && selectedChat) {
      try {
        await sendMessage(selectedChat.id, message.trim());
        setMessage('');
        setIsTyping(false);
        if (selectedChat) {
          sendTypingIndicator(selectedChat.id, false);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        setError('Failed to send message');
      }
    }
  };

  const handleChatSelect = async (chat: any) => {
    setSelectedChat(chat);
    // Clear existing messages for this chat before loading new ones
    clearChatMessages(chat.id);
    try {
      const chatMessages = await apiService.getMessages(chat.id);
      chatMessages.forEach(msg => {
        addMessage(chat.id, {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          chatId: msg.chatId,
          type: msg.type,
          attachments: msg.attachments,
          replyTo: msg.replyTo,
          status: msg.status as any,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt
        });
      });
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const handleMessageRead = (messageId: string) => {
    markMessageAsRead(messageId);
  };

  const getMessageStatusIcon = (status?: MessageStatus) => {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      case 'failed': return '❌';
      default: return '✓';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading...</div>
          <div className="text-sm text-gray-600">Connecting to ParentConnect</div>
        </div>
      </div>
    );
  }

  const currentChatMessages = selectedChat ? messages.get(selectedChat.id) || [] : [];
  const currentTypingUsers = selectedChat ? typingUsers.get(selectedChat.id) || new Set() : new Set();

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">ParentConnect</h2>
              <p className="text-sm opacity-90 mt-1">{currentUser.name}</p>
              <div className="flex items-center mt-2">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-white bg-opacity-20 border border-white border-opacity-30 text-white px-3 py-2 rounded text-sm hover:bg-opacity-30 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                selectedChat?.id === chat.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold text-gray-900">{chat.name}</div>
              <div className="text-sm text-gray-600">
                {chat.type === 'class' ? 'Class Chat' : 'Direct Message'}
              </div>
              {chat.unreadCount && chat.unreadCount > 0 && (
                <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-1">
                  {chat.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-gray-200 flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
            {selectedChat?.name.charAt(0) || 'C'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{selectedChat?.name || 'Select a chat'}</div>
            <div className="text-sm text-gray-600">
              {selectedChat?.type === 'class' ? 'Class Chat' : 'Direct Message'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {currentChatMessages.map((msg) => (
            <div key={msg.id} className="mb-4">
              <div className={`max-w-xs lg:max-w-md ${
                msg.senderId === currentUser.id ? 'ml-auto' : 'mr-auto'
              }`}>
                <div className={`p-3 rounded-lg ${
                  msg.senderId === currentUser.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <div className="text-xs opacity-80 mb-1">
                    {msg.senderId === currentUser.id ? currentUser.name : (users[msg.senderId] || `User ${msg.senderId}`)}
                  </div>
                  <div>{msg.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    {msg.senderId === currentUser.id && (
                      <div className="text-xs text-gray-400">
                        {getMessageStatusIcon(msg.status)}
                      </div>
                    )}
                  </div>
                </div>
                {msg.senderId !== currentUser.id && (
                  <button
                    onClick={() => handleMessageRead(msg.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicators */}
          {currentTypingUsers.size > 0 && (
            <div className="mb-4">
              <div className="max-w-xs lg:max-w-md mr-auto">
                <div className="bg-white text-gray-900 border border-gray-200 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    {Array.from(currentTypingUsers).map(userId => 
                      users[userId as string] || `User ${userId}`
                    ).join(', ')} {currentTypingUsers.size === 1 ? 'is' : 'are'} typing...
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (!isTyping) {
                  setIsTyping(true);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || !selectedChat}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </div>
          
          {error && (
            <div className="mt-2 text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
