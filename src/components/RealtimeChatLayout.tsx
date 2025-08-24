import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { apiService } from '../services/api';
import { MessageStatus } from '../services/websocket';
import Avatar from './Avatar';

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

  const getChatDisplayName = (chat: any) => {
    if (chat.type === 'class') {
      return chat.name;
    } else if (chat.type === 'direct') {
      // For direct messages, find the other participant
      const otherParticipantId = chat.participants?.find((p: string) => p !== currentUser.id);
      return users[otherParticipantId] || 'Unknown User';
    }
    return chat.name;
  };

  const {
    messages,
    onlineUsers,
    typingUsers,
    isConnected,
    chats,
    selectedChat,
    addMessage,
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
        
        // Fetch all users to build the user mapping
        try {
          const allUsers = await apiService.getAllUsers();
          const userNames: {[key: string]: string} = {};
          allUsers.forEach((user: any) => {
            userNames[user.id] = user.name;
          });
          setUsers(userNames);
        } catch (error) {
          console.error('Failed to fetch users, using fallback mapping:', error);
          // Fallback to hardcoded mapping if API fails
          const userNames = {
            '40e8b510-17bc-418e-894a-0d363f8758e7': 'Sarah Johnson',
            'a9836588-2316-4360-a670-ca306b5f3d57': 'Michael Chen', 
            '5daf3326-c042-4ad9-a53b-3baaed0533e5': 'Emily Rodriguez',
            '3b6873f7-a3b6-4773-b26d-6ba7c5d82b36': 'David Thompson',
            '162b123d-d09d-4e22-b061-19479110e5f6': 'Lisa Wang'
          };
          setUsers(userNames);
        }
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
          {chats.map((chat: any) => {
            // Get other participants in the chat (excluding current user)
            const otherParticipants = chat.participants?.filter((p: string) => p !== currentUser.id) || [];
            
            // Check if any other participants are online
            const onlineParticipants = otherParticipants.filter((userId: string) => onlineUsers.has(userId));
            const isAnyOtherUserOnline = onlineParticipants.length > 0;
            
            return (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{getChatDisplayName(chat)}</div>
                  {chat.type === 'direct' && (
                    <div className={`w-2 h-2 rounded-full ${isAnyOtherUserOnline ? 'bg-green-400' : 'bg-gray-400'}`} 
                         title={isAnyOtherUserOnline ? 'Online' : 'Offline'}></div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {chat.type === 'class' ? 'Class Chat' : 'Direct Message'}
                  {chat.type === 'direct' && isAnyOtherUserOnline && (
                    <span className="ml-2 text-green-600">• Online</span>
                  )}
                </div>
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-1">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-gray-200 flex items-center">
          <Avatar 
            src={selectedChat?.type === 'direct' ? 
              (() => {
                const otherParticipantId = (selectedChat as any).participants?.find((p: string) => p !== currentUser.id);
                // For demo purposes, map user IDs to mock avatars
                const avatarMap: {[key: string]: string} = {
                  '40e8b510-17bc-418e-894a-0d363f8758e7': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                  'a9836588-2316-4360-a670-ca306b5f3d57': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                  '5daf3326-c042-4ad9-a53b-3baaed0533e5': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                  '3b6873f7-a3b6-4773-b26d-6ba7c5d82b36': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                };
                return avatarMap[otherParticipantId] || undefined;
              })() : undefined
            }
            alt={getChatDisplayName(selectedChat) || 'Chat'}
            size="lg"
            className="mr-3 bg-blue-600"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{selectedChat ? getChatDisplayName(selectedChat) : 'Select a chat'}</div>
            <div className="text-sm text-gray-600 flex items-center">
              {selectedChat?.type === 'class' ? 'Class Chat' : 'Direct Message'}
              {selectedChat?.type === 'direct' && (() => {
                const otherParticipantId = (selectedChat as any).participants?.find((p: string) => p !== currentUser.id);
                const isOtherUserOnline = otherParticipantId ? onlineUsers.has(otherParticipantId) : false;
                return (
                  <span className="ml-2 flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-1 ${isOtherUserOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    <span className={isOtherUserOnline ? 'text-green-600' : 'text-gray-500'}>
                      {isOtherUserOnline ? 'Online' : 'Offline'}
                    </span>
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {currentChatMessages.map((msg) => {
            const isOwnMessage = msg.senderId === currentUser.id;
            const avatarMap: {[key: string]: string} = {
              '40e8b510-17bc-418e-894a-0d363f8758e7': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
              'a9836588-2316-4360-a670-ca306b5f3d57': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
              '5daf3326-c042-4ad9-a53b-3baaed0533e5': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
              '3b6873f7-a3b6-4773-b26d-6ba7c5d82b36': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            };
            
            return (
              <div key={msg.id} className="mb-4">
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {!isOwnMessage && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar 
                          src={avatarMap[msg.senderId]}
                          alt={users[msg.senderId] || `User ${msg.senderId}`}
                          size="sm"
                          className="bg-gray-200"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {msg.senderId === currentUser.id ? currentUser.name : (users[msg.senderId] || `User ${msg.senderId}`)}
                        </span>
                      </div>
                    )}
                    <div className={`p-3 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      <div>{msg.content}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className={`text-xs ${isOwnMessage ? 'opacity-70' : 'opacity-70'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        {isOwnMessage && (
                          <div className="text-xs text-gray-400">
                            {getMessageStatusIcon(msg.status)}
                          </div>
                        )}
                      </div>
                    </div>
                    {!isOwnMessage && (
                      <button
                        onClick={() => handleMessageRead(msg.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
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
