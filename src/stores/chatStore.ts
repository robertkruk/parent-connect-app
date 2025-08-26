import { create } from 'zustand';
import { websocketService, type ChatMessage, MessageStatus } from '../services/websocket';
import { apiService } from '../services/api';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  type: 'text' | 'image' | 'file' | 'voice';
  attachments?: string[];
  replyTo?: string;
  status?: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'class' | 'direct' | 'group';
  unreadCount: number;
  lastMessage?: Message;
}

interface ChatState {
  // Real-time message state
  messages: Map<string, Message[]>;
  messageStatus: Map<string, MessageStatus>;
  
  // User presence
  onlineUsers: Set<string>;
  typingUsers: Map<string, Set<string>>; // chatId -> Set<userId>
  
  // Connection state
  isConnected: boolean;
  reconnectAttempts: number;
  
  // Chat list
  chats: Chat[];
  selectedChat: Chat | null;
  
  // Actions
  addMessage: (chatId: string, message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  setTypingIndicator: (chatId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setChats: (chats: Chat[]) => void;
  setSelectedChat: (chat: Chat | null) => void;
  clearChatMessages: (chatId: string) => void;
  markMessageAsRead: (messageId: string) => Promise<void>;
  
  // WebSocket integration
  initializeWebSocket: (token: string) => Promise<void>;
  disconnectWebSocket: () => void;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'file' | 'voice', attachments?: string[], replyTo?: string) => Promise<string>;
  sendTypingIndicator: (chatId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: new Map(),
  messageStatus: new Map(),
  onlineUsers: new Set(),
  typingUsers: new Map(),
  isConnected: false,
  reconnectAttempts: 0,
  chats: [],
  selectedChat: null,

  // Message actions
  addMessage: (chatId: string, message: Message) => {
    set((state) => {
      const currentMessages = state.messages.get(chatId) || [];
      
      // Check if message already exists to prevent duplicates
      const messageExists = currentMessages.some(existingMsg => existingMsg.id === message.id);
      if (messageExists) {
        console.log('🚫 Duplicate message prevented:', message.id);
        return state; // Return unchanged state if message already exists
      }
      
      console.log('✅ Adding new message:', message.id, 'to chat:', chatId);
      const updatedMessages = [...currentMessages, message]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      const newMessages = new Map(state.messages);
      newMessages.set(chatId, updatedMessages);
      
      return {
        messages: newMessages,
        messageStatus: new Map(state.messageStatus).set(message.id, message.status || MessageStatus.SENT)
      };
    });
  },

  updateMessageStatus: (messageId: string, status: MessageStatus) => {
    set((state) => {
      const newMessageStatus = new Map(state.messageStatus);
      newMessageStatus.set(messageId, status);
      
      // Also update the message objects in the messages Map
      const newMessages = new Map(state.messages);
      for (const [chatId, messages] of newMessages) {
        const updatedMessages = messages.map(msg => 
          msg.id === messageId ? { ...msg, status } : msg
        );
        newMessages.set(chatId, updatedMessages);
      }
      
      return { 
        messageStatus: newMessageStatus,
        messages: newMessages
      };
    });
  },

  setTypingIndicator: (chatId: string, userId: string, isTyping: boolean) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      
      if (isTyping) {
        const currentTyping = newTypingUsers.get(chatId) || new Set();
        currentTyping.add(userId);
        newTypingUsers.set(chatId, currentTyping);
      } else {
        const currentTyping = newTypingUsers.get(chatId);
        if (currentTyping) {
          currentTyping.delete(userId);
          if (currentTyping.size === 0) {
            newTypingUsers.delete(chatId);
          }
        }
      }
      
      return { typingUsers: newTypingUsers };
    });
  },

  setUserOnline: (userId: string, isOnline: boolean) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      
      if (isOnline) {
        newOnlineUsers.add(userId);
      } else {
        newOnlineUsers.delete(userId);
      }
      
      return { onlineUsers: newOnlineUsers };
    });
  },

  setConnectionStatus: (isConnected: boolean) => {
    set({ isConnected });
  },

  setChats: (chats: Chat[]) => {
    set({ chats });
  },

  setSelectedChat: (chat: Chat | null) => {
    set({ selectedChat: chat });
  },

  clearChatMessages: (chatId: string) => {
    set((state) => {
      const currentMessages = state.messages.get(chatId) || [];
      console.log('🧹 Clearing messages for chat:', chatId, 'Count:', currentMessages.length);
      const newMessages = new Map(state.messages);
      newMessages.set(chatId, []);
      return { messages: newMessages };
    });
  },

  markMessageAsRead: async (messageId: string) => {
    try {
      // Update local status immediately for optimistic UI update
      get().updateMessageStatus(messageId, MessageStatus.READ);
      
      // Send read receipt via WebSocket
      websocketService.markMessageAsRead(messageId);
      
      // Also persist to database via REST API
      const selectedChat = get().selectedChat;
      if (selectedChat) {
        await apiService.markMessageAsRead(selectedChat.id, messageId);
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      // Revert local status on error
      get().updateMessageStatus(messageId, MessageStatus.DELIVERED);
    }
  },

  // WebSocket integration
  initializeWebSocket: async (token: string) => {
    try {
      // Set up WebSocket event handlers
      websocketService.onMessage = (message: ChatMessage) => {
        const newMessage: Message = {
          id: message.data.id,
          content: message.data.content,
          senderId: message.data.senderId,
          chatId: message.data.chatId,
          type: message.data.messageType,
          attachments: message.data.attachments,
          replyTo: message.data.replyTo,
          status: MessageStatus.DELIVERED,
          createdAt: new Date(message.data.timestamp).toISOString(),
          updatedAt: new Date(message.data.timestamp).toISOString()
        };
        
        get().addMessage(message.data.chatId, newMessage);
      };

      websocketService.onStatusUpdate = (messageId: string, status: MessageStatus) => {
        get().updateMessageStatus(messageId, status);
      };

      websocketService.onTypingIndicator = (chatId: string, userId: string, isTyping: boolean) => {
        get().setTypingIndicator(chatId, userId, isTyping);
      };

      websocketService.onUserPresence = (userId: string, isOnline: boolean) => {
        get().setUserOnline(userId, isOnline);
      };

      websocketService.onConnectionChange = (isConnected: boolean) => {
        get().setConnectionStatus(isConnected);
      };

      websocketService.onError = (error: string) => {
        console.error('WebSocket error:', error);
        // You could add error handling here, like showing a notification
      };

      // Connect to WebSocket
      await websocketService.connect(token);
      
      // Fetch current online users after WebSocket connection is established
      try {
        const onlineUsersResponse = await apiService.getOnlineUsers();
        const onlineUserIds = onlineUsersResponse.map((user: { userId: string }) => user.userId);
        console.log('👥 Fetched online users:', onlineUserIds);
        
        // Update the online users set
        set(() => {
          const newOnlineUsers = new Set<string>(onlineUserIds);
          return { onlineUsers: newOnlineUsers };
        });
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      }
      
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      throw error;
    }
  },

  disconnectWebSocket: () => {
    websocketService.disconnect();
    set({
      isConnected: false,
      onlineUsers: new Set(),
      typingUsers: new Map()
    });
  },

  sendMessage: async (chatId: string, content: string, type: 'text' | 'image' | 'file' | 'voice' = 'text', attachments?: string[], replyTo?: string, currentUserId?: string) => {
    try {
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        senderId: currentUserId || '', // Use provided current user ID for optimistic update
        chatId,
        type,
        attachments,
        replyTo,
        status: MessageStatus.SENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add optimistic message to UI
      get().addMessage(chatId, optimisticMessage);

      // Send via WebSocket
      const messageId = await websocketService.sendMessage(chatId, content, type, attachments, replyTo, currentUserId);
      
      // Update message status to sent
      get().updateMessageStatus(optimisticMessage.id, MessageStatus.SENT);
      
      return messageId;
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update message status to failed
      get().updateMessageStatus(`temp-${Date.now()}`, MessageStatus.FAILED);
      throw error;
    }
  },

  sendTypingIndicator: (chatId: string, isTyping: boolean, currentUserId?: string) => {
    websocketService.sendTypingIndicator(chatId, isTyping, currentUserId);
  }
}));
