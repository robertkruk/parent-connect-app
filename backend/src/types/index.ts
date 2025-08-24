export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  parentId: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  school: string;
  teacher: string;
  description?: string;
  children: string[]; // Child IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  type: 'text' | 'image' | 'file' | 'voice';
  attachments?: string[];
  replyTo?: string; // ID of message being replied to
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageStatus {
  messageId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  updatedAt: Date;
}

export interface MessageReceipt {
  id: string;
  messageId: string;
  userId: string;
  receiptType: 'delivered' | 'read';
  timestamp: Date;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  socketId?: string;
}

export interface QueuedMessage {
  id: string;
  userId: string;
  messageId: string;
  queuedAt: Date;
  attempts: number;
  maxAttempts: number;
  nextAttempt: Date;
}

export interface Chat {
  id: string;
  name: string;
  type: 'class' | 'direct' | 'group';
  participants: string[]; // User IDs
  classId?: string; // For class chats
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface CreateChildRequest {
  name: string;
  grade: string;
  school: string;
}

export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'image' | 'file' | 'voice';
  attachments?: string[];
  replyTo?: string;
}

// WebSocket message types for real-time communications
export interface WebSocketMessage {
  id: string;
  type: 'message' | 'typing' | 'presence' | 'receipt' | 'heartbeat' | 'auth' | 'error';
  timestamp: number;
  data: any;
}

export interface ChatMessage {
  type: 'message';
  data: {
    id: string;
    chatId: string;
    content: string;
    senderId: string;
    messageType: 'text' | 'image' | 'file' | 'voice';
    attachments?: any[];
    replyTo?: string;
    timestamp: number;
  };
}

export interface TypingIndicator {
  type: 'typing';
  data: {
    chatId: string;
    userId: string;
    isTyping: boolean;
  };
}

export interface PresenceUpdate {
  type: 'presence';
  data: {
    userId: string;
    status: 'online' | 'away' | 'offline';
    lastSeen?: number;
  };
}

export interface MessageReceipt {
  type: 'receipt';
  data: {
    messageId: string;
    receiptType: 'delivered' | 'read';
    timestamp: number;
  };
}

export interface AuthMessage {
  type: 'auth';
  data: {
    token: string;
  };
}

// Legacy WebSocket message type (keeping for backward compatibility)
export interface LegacyWebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'join' | 'leave';
  data: any;
  chatId: string;
  userId: string;
}
