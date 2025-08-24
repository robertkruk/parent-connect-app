// API service for communicating with the backend

const API_BASE_URL = 'http://localhost:3000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  children?: Child[];
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  parentId: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  type: 'text' | 'image' | 'file' | 'voice';
  attachments?: string[];
  replyTo?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'class' | 'direct' | 'group';
  classId?: string;
  participants?: string[];
  unreadCount?: number;
  lastMessage?: Message;
}

export interface MessageStatus {
  messageId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  updatedAt: string;
}

export interface MessageReceipt {
  id: string;
  messageId: string;
  userId: string;
  receiptType: 'delivered' | 'read';
  timestamp: string;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  socketId?: string;
}

export interface WebSocketStats {
  connections: number;
  authenticatedConnections: number;
  totalUsers: number;
  typingUsers: number;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    // Store token in localStorage for persistence
    localStorage.setItem('parentConnect_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('parentConnect_token');
  }

  getToken(): string | null {
    if (!this.token) {
      // Try to load from localStorage
      this.token = localStorage.getItem('parentConnect_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making request to:', url);
    console.log('Request options:', options);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log('Request headers:', headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const error = await response.text();
        console.error('Response error:', error);
        throw new Error(error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    console.log('Attempting login with:', { email, password });
    const response = await this.request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    console.log('Login response:', response);
    
    // Transform user data to match the User interface
    const user: User = {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      phone: response.user.phone,
      isVerified: response.user.isVerified || true, // Default to true if not provided
      children: response.user.children || []
    };
    
    this.setToken(response.token);
    return {
      token: response.token,
      user
    };
  }

  async register(name: string, email: string, password: string, phone?: string): Promise<{ token: string; user: User }> {
    const response = await this.request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
    
    // Transform user data to match the User interface
    const user: User = {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      phone: response.user.phone,
      isVerified: response.user.isVerified || false, // Default to false for new registrations
      children: response.user.children || []
    };
    
    this.setToken(response.token);
    return {
      token: response.token,
      user
    };
  }

  // User profile
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  // User presence
  async getUserPresence(): Promise<UserPresence | undefined> {
    return this.request<UserPresence | undefined>('/users/presence');
  }

  async getOnlineUsers(): Promise<Array<{ userId: string }>> {
    return this.request<Array<{ userId: string }>>('/users/online');
  }

  // Children
  async getChildren(): Promise<Child[]> {
    return this.request<Child[]>('/children');
  }

  async createChild(name: string, grade: string, school: string): Promise<Child> {
    return this.request<Child>('/children', {
      method: 'POST',
      body: JSON.stringify({ name, grade, school }),
    });
  }

  // Chats
  async getChats(): Promise<Chat[]> {
    const chats = await this.request<any[]>('/chats');
    return chats.map(chat => ({
      id: chat.id,
      name: chat.name,
      type: chat.type,
      classId: chat.class_id,
      participants: chat.participants,
      unreadCount: chat.unreadCount || 0,
      lastMessage: chat.lastMessage ? {
        id: chat.lastMessage.id,
        content: chat.lastMessage.content,
        senderId: chat.lastMessage.sender_id,
        chatId: chat.lastMessage.chat_id,
        type: chat.lastMessage.type,
        attachments: chat.lastMessage.attachments,
        replyTo: chat.lastMessage.reply_to,
        status: chat.lastMessage.status,
        createdAt: chat.lastMessage.created_at,
        updatedAt: chat.lastMessage.updated_at
      } : undefined
    }));
  }

  async getChat(chatId: string): Promise<Chat> {
    return this.request<Chat>(`/chats/${chatId}`);
  }

  // Messages
  async getMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const messages = await this.request<any[]>(`/chats/${chatId}/messages?${params}`);
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.sender_id,
      chatId: msg.chat_id,
      type: msg.type,
      attachments: msg.attachments,
      replyTo: msg.reply_to,
      status: msg.status,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    }));
  }

  async sendMessage(chatId: string, content: string, type: 'text' | 'image' | 'file' | 'voice' = 'text', attachments?: string[], replyTo?: string): Promise<Message> {
    return this.request<Message>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type, attachments, replyTo }),
    });
  }

  async markMessageAsRead(chatId: string, messageId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/chats/${chatId}/messages/${messageId}/read`, {
      method: 'POST',
    });
  }

  // Message status and receipts
  async getMessageStatus(messageId: string): Promise<MessageStatus | undefined> {
    return this.request<MessageStatus | undefined>(`/messages/${messageId}/status`);
  }

  async getMessageReceipts(messageId: string): Promise<MessageReceipt[]> {
    return this.request<MessageReceipt[]>(`/messages/${messageId}/receipts`);
  }

  // WebSocket statistics
  async getWebSocketStats(): Promise<WebSocketStats> {
    return this.request<WebSocketStats>('/websocket/stats');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Auto-login if token exists
  async autoLogin(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const user = await this.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Auto-login failed:', error);
      this.clearToken();
      return null;
    }
  }
}

export const apiService = new ApiService();
