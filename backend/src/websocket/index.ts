import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { db } from '../database/index.js';

// JWT secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-change-in-production';

// WebSocket message types
export interface WebSocketMessage {
  id: string;
  type: 'message' | 'typing' | 'presence' | 'receipt' | 'heartbeat' | 'auth';
  timestamp: number;
  data: any;
}

// Message types
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

// Message status enum
export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

// Connection tracking
interface Connection {
  id: string;
  userId: string;
  ws: any;
  isAuthenticated: boolean;
  lastHeartbeat: number;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private connections: Map<string, Connection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set<connectionId>
  private typingUsers: Map<string, Set<string>> = new Map(); // chatId -> Set<userId>
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: any) {
    console.log('🔌 Creating WebSocket server on port 3001...');
    // Create WebSocket server on a separate port for now
    this.wss = new WebSocketServer({ port: 3001 });
    console.log('🔌 WebSocket server created, setting up event handlers...');
    this.setupWebSocketServer();
    console.log('🔌 Starting heartbeat...');
    this.startHeartbeat();
    console.log('🔌 WebSocket server setup complete');
  }

  private setupWebSocketServer() {
    console.log('🔌 Setting up WebSocket server event handlers...');
    
    this.wss.on('connection', (ws, request) => {
      console.log('🔌 WebSocket connection event triggered!');
      const connectionId = uuidv4();
      const connection: Connection = {
        id: connectionId,
        userId: '',
        ws,
        isAuthenticated: false,
        lastHeartbeat: Date.now()
      };

      this.connections.set(connectionId, connection);

      console.log(`🔌 New WebSocket connection: ${connectionId}`);

      ws.on('message', (data) => {
        try {
          console.log(`📨 Raw message received from ${connectionId}:`, data.toString());
          const message: WebSocketMessage = JSON.parse(data.toString());
          console.log(`📨 Parsed message from ${connectionId}:`, message.type, message.data);
          this.handleMessage(connectionId, message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          this.sendError(connectionId, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log(`🔌 WebSocket connection closed: ${connectionId}`);
        this.handleDisconnection(connectionId);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for connection ${connectionId}:`, error);
        this.handleDisconnection(connectionId);
      });

      // Send connection established message
      this.sendMessage(connectionId, {
        id: uuidv4(),
        type: 'auth',
        timestamp: Date.now(),
        data: { status: 'connected', connectionId }
      });
    });
    
    console.log('🔌 WebSocket server event handlers set up complete');
  }

  private async handleMessage(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.log(`❌ No connection found for ${connectionId}`);
      return;
    }

    console.log(`📨 Processing message from ${connectionId}:`, message.type);

    switch (message.type) {
      case 'auth':
        console.log(`🔐 Processing auth message from ${connectionId}`);
        await this.handleAuth(connectionId, message as AuthMessage);
        break;
      case 'message':
        console.log(`💬 Processing chat message from ${connectionId}`);
        await this.handleChatMessage(connectionId, message as ChatMessage);
        break;
      case 'typing':
        console.log(`⌨️ Processing typing indicator from ${connectionId}`);
        await this.handleTypingIndicator(connectionId, message as TypingIndicator);
        break;
      case 'receipt':
        console.log(`📋 Processing message receipt from ${connectionId}`);
        await this.handleMessageReceipt(connectionId, message as MessageReceipt);
        break;
      case 'heartbeat':
        console.log(`💓 Processing heartbeat from ${connectionId}`);
        this.handleHeartbeat(connectionId);
        break;
      default:
        console.log(`❓ Unknown message type from ${connectionId}:`, message.type);
        this.sendError(connectionId, `Unknown message type: ${message.type}`);
    }
  }

  private async handleAuth(connectionId: string, message: AuthMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      // Verify JWT token
      const decoded = jwt.verify(message.data.token, JWT_SECRET) as any;
      const user = db.getUserById(decoded.userId);
      
      if (!user) {
        this.sendError(connectionId, 'Invalid user');
        return;
      }

      // Authenticate connection
      connection.userId = user.id;
      connection.isAuthenticated = true;
      connection.lastHeartbeat = Date.now();

      // Track user connections
      if (!this.userConnections.has(user.id)) {
        this.userConnections.set(user.id, new Set());
      }
      this.userConnections.get(user.id)!.add(connectionId);

      // Update user presence
      await this.updateUserPresence(user.id, 'online');

      // Notify other users about presence
      this.broadcastPresence(user.id, 'online');

      console.log(`✅ User ${user.name} (${user.id}) authenticated on connection ${connectionId}`);

      // Send authentication success
      this.sendMessage(connectionId, {
        id: uuidv4(),
        type: 'auth',
        timestamp: Date.now(),
        data: { status: 'authenticated', user: { id: user.id, name: user.name } }
      });

      // Send current online users to the newly authenticated user
      const onlineUsers = db.getOnlineUsers();
      for (const onlineUser of onlineUsers) {
        if (onlineUser.user_id !== user.id) {
          this.sendMessage(connectionId, {
            id: uuidv4(),
            type: 'presence',
            timestamp: Date.now(),
            data: { userId: onlineUser.user_id, status: 'online' }
          });
        }
      }

    } catch (error) {
      console.error('❌ Authentication error:', error);
      this.sendError(connectionId, 'Authentication failed');
    }
  }

  private async handleChatMessage(connectionId: string, message: ChatMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isAuthenticated) {
      this.sendError(connectionId, 'Not authenticated');
      return;
    }

    try {
      // Create message in database
      const dbMessage = db.createMessage({
        content: message.data.content,
        senderId: connection.userId,
        chatId: message.data.chatId,
        type: message.data.messageType,
        attachments: message.data.attachments
      });

      // Update message with database ID
      const updatedMessage: ChatMessage = {
        ...message,
        data: {
          ...message.data,
          id: dbMessage.id,
          timestamp: Date.now()
        }
      };

      // Broadcast message to all users in the chat
      await this.broadcastToChat(message.data.chatId, updatedMessage, connection.userId);

      // Update message status to sent
      await this.updateMessageStatus(dbMessage.id, MessageStatus.SENT);

      console.log(`💬 Message sent by ${connection.userId} in chat ${message.data.chatId}`);

    } catch (error) {
      console.error('❌ Error handling chat message:', error);
      this.sendError(connectionId, 'Failed to send message');
    }
  }

  private async handleTypingIndicator(connectionId: string, message: TypingIndicator) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isAuthenticated) return;

    const { chatId, userId, isTyping } = message.data;

    if (isTyping) {
      if (!this.typingUsers.has(chatId)) {
        this.typingUsers.set(chatId, new Set());
      }
      this.typingUsers.get(chatId)!.add(userId);
    } else {
      this.typingUsers.get(chatId)?.delete(userId);
    }

    // Broadcast typing indicator to other users in the chat
    await this.broadcastToChat(chatId, message, userId);
  }

  private async handleMessageReceipt(connectionId: string, message: MessageReceipt) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isAuthenticated) return;

    try {
      // Update message status in database
      await this.updateMessageStatus(message.data.messageId, 
        message.data.receiptType === 'read' ? MessageStatus.READ : MessageStatus.DELIVERED);

      // Broadcast receipt to message sender
      const originalMessage = db.getMessageById(message.data.messageId);
      if (originalMessage) {
        this.sendToUser(originalMessage.senderId, {
          id: uuidv4(),
          type: 'receipt',
          timestamp: Date.now(),
          data: message.data
        });
      }

    } catch (error) {
      console.error('❌ Error handling message receipt:', error);
    }
  }

  private handleHeartbeat(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastHeartbeat = Date.now();
    }
  }

  private async broadcastToChat(chatId: string, message: WebSocketMessage, excludeUserId?: string) {
    try {
      // Get all users in the chat
      const chat = db.getChatById(chatId);
      if (!chat) return;

      // For now, we'll broadcast to all authenticated users
      // In a real implementation, you'd get the actual chat participants
      for (const [connectionId, connection] of this.connections) {
        if (connection.isAuthenticated && connection.userId !== excludeUserId) {
          this.sendMessage(connectionId, message);
        }
      }
    } catch (error) {
      console.error('❌ Error broadcasting to chat:', error);
    }
  }

  private broadcastPresence(userId: string, status: 'online' | 'away' | 'offline') {
    const presenceMessage: WebSocketMessage = {
      id: uuidv4(),
      type: 'presence',
      timestamp: Date.now(),
      data: { userId, status, lastSeen: status === 'offline' ? Date.now() : undefined }
    };

    // Broadcast to all other users
    for (const [connectionId, connection] of this.connections) {
      if (connection.isAuthenticated && connection.userId !== userId) {
        this.sendMessage(connectionId, presenceMessage);
      }
    }
  }

  private sendToUser(userId: string, message: WebSocketMessage) {
    const userConnections = this.userConnections.get(userId);
    if (userConnections) {
      for (const connectionId of userConnections) {
        this.sendMessage(connectionId, message);
      }
    }
  }

  private sendMessage(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.ws.readyState === 1) { // WebSocket.OPEN
      try {
        connection.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`❌ Error sending message to ${connectionId}:`, error);
        this.handleDisconnection(connectionId);
      }
    }
  }

  private sendError(connectionId: string, error: string) {
    this.sendMessage(connectionId, {
      id: uuidv4(),
      type: 'error',
      timestamp: Date.now(),
      data: { error }
    });
  }

  private async updateUserPresence(userId: string, status: 'online' | 'away' | 'offline') {
    try {
      // Update user presence in database
      const now = new Date().toISOString();
      const stmt = db.db.prepare(`
        INSERT OR REPLACE INTO user_presence (user_id, status, last_seen)
        VALUES (?, ?, ?)
      `);
      stmt.run(userId, status, now);
      console.log(`👤 User ${userId} presence updated to: ${status}`);
    } catch (error) {
      console.error('❌ Error updating user presence:', error);
    }
  }

  private async updateMessageStatus(messageId: string, status: MessageStatus) {
    try {
      // Update message status in database
      const now = new Date().toISOString();
      const stmt = db.db.prepare(`
        INSERT OR REPLACE INTO message_status (message_id, status, updated_at)
        VALUES (?, ?, ?)
      `);
      stmt.run(messageId, status, now);
      console.log(`📊 Message ${messageId} status updated to: ${status}`);
    } catch (error) {
      console.error('❌ Error updating message status:', error);
    }
  }

  private handleDisconnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log(`🔌 WebSocket connection closed: ${connectionId}`);

    if (connection.isAuthenticated) {
      // Remove from user connections
      const userConnections = this.userConnections.get(connection.userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId);
          // User is offline
          this.updateUserPresence(connection.userId, 'offline');
          this.broadcastPresence(connection.userId, 'offline');
        }
      }
    }

    this.connections.delete(connectionId);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      for (const [connectionId, connection] of this.connections) {
        if (now - connection.lastHeartbeat > timeout) {
          console.log(`💓 Connection ${connectionId} timed out, closing...`);
          connection.ws.close();
          this.handleDisconnection(connectionId);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  public stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }

  public getStats() {
    return {
      totalConnections: this.connections.size,
      authenticatedConnections: Array.from(this.connections.values()).filter(c => c.isAuthenticated).length,
      totalUsers: this.userConnections.size,
      typingUsers: Array.from(this.typingUsers.values()).reduce((sum, users) => sum + users.size, 0)
    };
  }
}

export default WebSocketManager;
