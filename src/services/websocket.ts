import { v4 as uuidv4 } from 'uuid';

// WebSocket message types
export interface WebSocketMessage {
  id: string;
  type: 'message' | 'typing' | 'presence' | 'receipt' | 'heartbeat' | 'auth' | 'error';
  timestamp: number;
  data: any;
}

// Message types
export interface ChatMessage extends WebSocketMessage {
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

export interface TypingIndicator extends WebSocketMessage {
  type: 'typing';
  data: {
    chatId: string;
    userId: string;
    isTyping: boolean;
  };
}

export interface PresenceUpdate extends WebSocketMessage {
  type: 'presence';
  data: {
    userId: string;
    status: 'online' | 'away' | 'offline';
    lastSeen?: number;
  };
}

export interface MessageReceipt extends WebSocketMessage {
  type: 'receipt';
  data: {
    messageId: string;
    receiptType: 'delivered' | 'read';
    timestamp: number;
  };
}

export interface AuthMessage extends WebSocketMessage {
  type: 'auth';
  data: {
    token: string;
  };
}

export const MessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
} as const;

export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

export interface QueuedMessage {
  id: string;
  chatId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice';
  attachments?: any[];
  replyTo?: string;
  timestamp: number;
  attempts: number;
}

class ParentConnectWebSocket {
  private ws: WebSocket | null = null;
  private messageQueue: QueuedMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private isAuthenticated = false;
  private authToken: string | null = null;

  // Event handlers
  public onMessage: ((message: ChatMessage) => void) | null = null;
  public onStatusUpdate: ((messageId: string, status: MessageStatus) => void) | null = null;
  public onTypingIndicator: ((chatId: string, userId: string, isTyping: boolean) => void) | null = null;
  public onUserPresence: ((userId: string, isOnline: boolean) => void) | null = null;
  public onConnectionChange: ((isConnected: boolean) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  constructor() {
    // Load queued messages from localStorage
    this.loadMessageQueue();
  }

  public async connect(token: string): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.authToken = token;

    try {
          // Connect to WebSocket server on port 4002
    this.ws = new WebSocket(`ws://localhost:4002`);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.isAuthenticated = false;
        
        // Send authentication message
        this.authenticate(token);
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Notify connection change
        if (this.onConnectionChange) {
          this.onConnectionChange(true);
        }
        
        // Process queued messages
        this.processMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Received WebSocket message:', message.type, message.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          if (this.onError) {
            this.onError('Failed to parse message');
          }
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.stopHeartbeat();
        
        // Notify connection change
        if (this.onConnectionChange) {
          this.onConnectionChange(false);
        }
        
        // Attempt reconnection if not a clean close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        if (this.onError) {
        this.onError('WebSocket connection error');
      }
      };

    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
      this.isConnecting = false;
      if (this.onError) {
        this.onError('Failed to connect to WebSocket');
      }
      throw error;
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isAuthenticated = false;
    this.onConnectionChange?.(false);
  }

  public async reconnect(): Promise<void> {
    if (this.authToken) {
      await this.connect(this.authToken);
    }
  }

  public sendMessage(chatId: string, content: string, messageType: 'text' | 'image' | 'file' | 'voice' = 'text', attachments?: any[], replyTo?: string, currentUserId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isAuthenticated) {
        console.log('⚠️ Not authenticated, queuing message');
        // Queue message for later
        const queuedMessage: QueuedMessage = {
          id: uuidv4(),
          chatId,
          content,
          messageType,
          attachments,
          replyTo,
          timestamp: Date.now(),
          attempts: 0
        };
        this.messageQueue.push(queuedMessage);
        this.saveMessageQueue();
        resolve(queuedMessage.id);
        return;
      }

      const messageId = uuidv4();
      const message: ChatMessage = {
        id: messageId,
        type: 'message',
        timestamp: Date.now(),
        data: {
          id: messageId,
          chatId,
          content,
          senderId: currentUserId || '', // Use provided current user ID
          messageType,
          attachments,
          replyTo,
          timestamp: Date.now()
        }
      };

      try {
        console.log('📤 Sending message:', message);
        this.send(message);
        resolve(messageId);
      } catch (error) {
        console.error('❌ Error sending message:', error);
        reject(error);
      }
    });
  }

  public sendTypingIndicator(chatId: string, isTyping: boolean, currentUserId?: string): void {
    if (!this.isAuthenticated) return;

    const message: TypingIndicator = {
      id: uuidv4(),
      type: 'typing',
      timestamp: Date.now(),
      data: {
        chatId,
        userId: currentUserId || '', // Use provided current user ID
        isTyping
      }
    };

    this.send(message);
  }

  public markMessageAsRead(messageId: string): void {
    if (!this.isAuthenticated) {
      return;
    }

    const message: MessageReceipt = {
      id: uuidv4(),
      type: 'receipt',
      timestamp: Date.now(),
      data: {
        messageId,
        receiptType: 'read',
        timestamp: Date.now()
      }
    };

    this.send(message);
  }

  public markMessageAsDelivered(messageId: string): void {
    if (!this.isAuthenticated) return;

    const message: MessageReceipt = {
      id: uuidv4(),
      type: 'receipt',
      timestamp: Date.now(),
      data: {
        messageId,
        receiptType: 'delivered',
        timestamp: Date.now()
      }
    };

    this.send(message);
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  private authenticate(token: string): void {
    console.log('🔐 Sending authentication message');
    const message: AuthMessage = {
      id: uuidv4(),
      type: 'auth',
      timestamp: Date.now(),
      data: { token }
    };
    this.send(message);
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 Processing WebSocket message:', message.type);

    switch (message.type) {
      case 'auth':
        this.handleAuthMessage(message);
        break;
      case 'message':
        this.handleChatMessage(message as ChatMessage);
        break;
      case 'typing':
        this.handleTypingMessage(message as TypingIndicator);
        break;
      case 'presence':
        this.handlePresenceMessage(message as PresenceUpdate);
        break;
      case 'receipt':
        this.handleReceiptMessage(message as MessageReceipt);
        break;
      case 'error':
        console.error('❌ WebSocket error:', message.data.error);
        if (this.onError) {
          this.onError(message.data.error);
        }
        break;
      default:
        console.warn('⚠️ Unknown message type:', message.type);
    }
  }

  private handleAuthMessage(message: WebSocketMessage): void {
    console.log('🔐 Auth message received:', message.data);
    
    if (message.data.status === 'authenticated') {
      console.log('✅ WebSocket authenticated');
      this.isAuthenticated = true;
      
      // Process any queued messages now that we're authenticated
      this.processMessageQueue();
    } else if (message.data.status === 'connected') {
      console.log('🔌 WebSocket connection established');
    } else if (message.data.error) {
      console.error('❌ Authentication failed:', message.data.error);
      if (this.onError) {
        this.onError(message.data.error);
      }
      this.isAuthenticated = false;
    }
  }

  private handleChatMessage(message: ChatMessage): void {
    console.log('💬 Chat message received:', message.data);
    
    // Mark message as delivered
    this.markMessageAsDelivered(message.data.id);
    
    // Notify message handler
    if (this.onMessage) {
      this.onMessage(message);
    }
  }

  private handleTypingMessage(message: TypingIndicator): void {
    console.log('⌨️ Typing indicator received:', message.data);
    if (this.onTypingIndicator) {
      this.onTypingIndicator(
        message.data.chatId,
        message.data.userId,
        message.data.isTyping
      );
    }
  }

  private handlePresenceMessage(message: PresenceUpdate): void {
    console.log('👤 Presence update received:', message.data);
    if (this.onUserPresence) {
      this.onUserPresence(
        message.data.userId,
        message.data.status === 'online'
      );
    }
  }

  private handleReceiptMessage(message: MessageReceipt): void {
    const status = message.data.receiptType === 'read' ? MessageStatus.READ : MessageStatus.DELIVERED;
    if (this.onStatusUpdate) {
      this.onStatusUpdate(message.data.messageId, status);
    }
  }

  private send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('📤 Sending WebSocket message:', message.type);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const heartbeat: WebSocketMessage = {
          id: uuidv4(),
          type: 'heartbeat',
          timestamp: Date.now(),
          data: {}
        };
        this.send(heartbeat);
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.authToken) {
        this.connect(this.authToken).catch(error => {
          console.error('❌ Reconnection failed:', error);
        });
      }
    }, delay);
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`📤 Processing ${this.messageQueue.length} queued messages`);
    
    const messagesToProcess = [...this.messageQueue];
    this.messageQueue = [];

    messagesToProcess.forEach(async (queuedMessage) => {
      try {
        await this.sendMessage(
          queuedMessage.chatId,
          queuedMessage.content,
          queuedMessage.messageType,
          queuedMessage.attachments,
          queuedMessage.replyTo
        );
      } catch (error) {
        console.error('❌ Failed to send queued message:', error);
        // Re-queue with increased attempts
        queuedMessage.attempts++;
        if (queuedMessage.attempts < 3) {
          this.messageQueue.push(queuedMessage);
        }
      }
    });

    this.saveMessageQueue();
  }

  private saveMessageQueue(): void {
    try {
      localStorage.setItem('parentConnect_messageQueue', JSON.stringify(this.messageQueue));
    } catch (error) {
      console.error('❌ Failed to save message queue:', error);
    }
  }

  private loadMessageQueue(): void {
    try {
      const saved = localStorage.getItem('parentConnect_messageQueue');
      if (saved) {
        this.messageQueue = JSON.parse(saved);
        console.log(`📥 Loaded ${this.messageQueue.length} queued messages`);
      }
    } catch (error) {
      console.error('❌ Failed to load message queue:', error);
      this.messageQueue = [];
    }
  }

  public getStats() {
    return {
      isConnected: this.isConnected(),
      isAuthenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    };
  }
}

// Create singleton instance
export const websocketService = new ParentConnectWebSocket();
