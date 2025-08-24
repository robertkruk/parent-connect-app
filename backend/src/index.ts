import { Elysia, t } from 'elysia';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './database/index.js';
import WebSocketManager from './websocket/index.js';
import type { 
  LoginRequest, 
  RegisterRequest, 
  CreateChildRequest, 
  SendMessageRequest
} from './types/index.js';

// JWT secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-change-in-production';

const app = new Elysia()
  .onRequest(({ request, set }) => {
    // Add CORS headers
    const origin = request.headers.get('origin');
    if (origin && (origin.includes('localhost:5173') || origin.includes('localhost:5174') || origin.includes('localhost:3000'))) {
      set.headers['Access-Control-Allow-Origin'] = origin;
    } else {
      set.headers['Access-Control-Allow-Origin'] = '*';
    }
    set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    set.headers['Access-Control-Allow-Credentials'] = 'true';
  })
  .options('*', () => {
    // Handle preflight requests
    return new Response(null, { status: 200 });
  })
  .derive(({ request }) => ({
    getCurrentUser: async () => {
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) return null;
      
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return db.getUserById(decoded.userId);
      } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
      }
    }
  }))
  .group('/api/auth', app => app
    .post('/register', async ({ body }) => {
      const { name, email, password, phone } = body as RegisterRequest;
      
      // Check if user already exists
      const existingUser = db.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = db.createUser({
        name,
        email,
        password: hashedPassword,
        phone,
        isVerified: false
      });
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified
        }
      };
    }, {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
        phone: t.Optional(t.String())
      })
    })
    .post('/login', async ({ body }) => {
      const { email, password } = body as LoginRequest;
      
      // Find user
      const user = db.getUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified
        }
      };
    }, {
      body: t.Object({
        email: t.String(),
        password: t.String()
      })
    })
  )
  .group('/api/users', app => app
    .get('/me', async ({ getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const children = db.getChildrenByParentId(user.id);
      
      return {
        ...user,
        children,
        password: undefined // Don't send password
      };
    })
    .get('/presence', async ({ getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const presence = db.getUserPresence(user.id);
      return presence;
    })
    .get('/online', async ({ getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const onlineUsers = db.getOnlineUsers();
      return onlineUsers;
    })
  )
  .group('/api/children', app => app
    .post('/', async ({ body, getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const child = db.createChild({
        ...body as CreateChildRequest,
        parentId: user.id
      });
      
      return child;
    }, {
      body: t.Object({
        name: t.String(),
        grade: t.String(),
        school: t.String()
      })
    })
    .get('/', async ({ getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      return db.getChildrenByParentId(user.id);
    })
  )
  .group('/api/chats', app => app
    .get('/', async ({ getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const chats = db.getChatsByUserId(user.id);
      
      // Get unread counts and last messages for each chat
      const chatsWithDetails = chats.map(chat => {
        const unreadCount = db.getUnreadMessageCount(chat.id, user.id);
        const lastMessage = db.getMessagesByChatId(chat.id, 1, 0)[0];
        const participants = db.getChatParticipants(chat.id);
        
        return {
          ...chat,
          unreadCount,
          lastMessage,
          participants
        };
      });
      
      return chatsWithDetails;
    })
    .get('/:id', async ({ params, getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const chat = db.getChatById(params.id);
      if (!chat) {
        throw new Error('Chat not found');
      }
      
      return chat;
    })
    .get('/:id/messages', async ({ params, query, getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const limit = parseInt(query.limit as string) || 50;
      const offset = parseInt(query.offset as string) || 0;
      
      const messages = db.getMessagesByChatId(params.id, limit, offset);
      
      // Add message status for each message
      const messagesWithStatus = messages.map(message => {
        const status = db.getMessageStatus(message.id);
        return {
          ...message,
          status: status?.status || 'sent'
        };
      });
      
      return messagesWithStatus;
    })
    .post('/:id/messages', async ({ params, body, getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const message = db.createMessage({
        content: (body as SendMessageRequest).content,
        senderId: user.id,
        chatId: params.id,
        type: (body as SendMessageRequest).type || 'text',
        attachments: (body as SendMessageRequest).attachments,
        replyTo: (body as SendMessageRequest).replyTo
      });
      
      return message;
    }, {
      body: t.Object({
        content: t.String(),
        type: t.Optional(t.Union([t.Literal('text'), t.Literal('image'), t.Literal('file'), t.Literal('voice')])),
        attachments: t.Optional(t.Array(t.String())),
        replyTo: t.Optional(t.String())
      })
    })
    .post('/:id/messages/:messageId/read', async ({ params, getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      db.markMessageAsRead(params.messageId, user.id);
      return { success: true };
    })
  )
  .group('/api/messages', app => app
    .get('/:id/status', async ({ params, getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const status = db.getMessageStatus(params.id);
      return status;
    })
    .get('/:id/receipts', async ({ params, getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const receipts = db.getMessageReceipts(params.id);
      return receipts;
    })
  )
  .group('/api/websocket', app => app
    .get('/stats', async ({ getCurrentUser }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      // Return WebSocket server statistics
      return {
        connections: 0, // Will be updated when WebSocket manager is integrated
        authenticatedConnections: 0,
        totalUsers: 0,
        typingUsers: 0
      };
    })
  )
  .get('/', () => ({
    message: 'ParentConnect API',
    version: '1.0.0',
    status: 'running',
    features: {
      realTime: true,
      webSocket: true,
      messageStatus: true,
      userPresence: true
    }
  }));

// Start the server and get the server instance
const server = app.listen(3000);

// Initialize WebSocket server after the HTTP server is running
console.log('🔌 Attempting to initialize WebSocket server...');
let wsManager: any;
try {
  wsManager = new WebSocketManager(server);
  console.log('🔌 WebSocket server initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize WebSocket server:', error);
}

console.log(
  `🦊 ParentConnect server is running on port 3000`
);
console.log('🔌 WebSocket server initialized');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  if (wsManager) {
    wsManager.stop();
  }
  db.close();
  process.exit(0);
});

export type App = typeof app;
