import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

class DatabaseService {
  private db: Database;

  constructor() {
    this.db = new Database('parentconnect.db');
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Read and execute schema
    const schemaPath = join(import.meta.dir, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    statements.forEach(statement => {
      if (statement) {
        this.db.run(statement);
      }
    });

    console.log('Database initialized successfully');
  }

  // User operations
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO users (id, name, email, password, avatar, phone, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, user.name, user.email, user.password, user.avatar, user.phone, user.isVerified, now, now);
    return this.getUserById(id);
  }

  getUserById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  getUserByEmail(email: string) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  updateUser(id: string, updates: Partial<User>) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      UPDATE users SET ${fields}, updated_at = ? WHERE id = ?
    `);
    
    stmt.run(...values, now, id);
    return this.getUserById(id);
  }

  // Child operations
  createChild(child: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO children (id, name, grade, school, parent_id, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, child.name, child.grade, child.school, child.parentId, child.avatar, now, now);
    return this.getChildById(id);
  }

  getChildById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM children WHERE id = ?');
    return stmt.get(id) as Child | undefined;
  }

  getChildrenByParentId(parentId: string) {
    const stmt = this.db.prepare('SELECT * FROM children WHERE parent_id = ?');
    return stmt.all(parentId) as Child[];
  }

  // Class operations
  createClass(cls: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO classes (id, name, grade, school, teacher, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, cls.name, cls.grade, cls.school, cls.teacher, cls.description, now, now);
    return this.getClassById(id);
  }

  getClassById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM classes WHERE id = ?');
    return stmt.get(id) as Class | undefined;
  }

  // Chat operations
  createChat(chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO chats (id, name, type, class_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, chat.name, chat.type, chat.classId, now, now);
    
    // Add participants
    chat.participants.forEach(participantId => {
      this.addChatParticipant(id, participantId);
    });
    
    return this.getChatById(id);
  }

  getChatById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE id = ?');
    return stmt.get(id) as Chat | undefined;
  }

  getChatsByUserId(userId: string) {
    const stmt = this.db.prepare(`
      SELECT c.* FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ?
      ORDER BY c.updated_at DESC
    `);
    return stmt.all(userId) as Chat[];
  }

  addChatParticipant(chatId: string, userId: string) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO chat_participants (chat_id, user_id)
      VALUES (?, ?)
    `);
    stmt.run(chatId, userId);
  }

  // Message operations
  createMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, content, sender_id, chat_id, type, attachments, reply_to, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const attachments = message.attachments ? JSON.stringify(message.attachments) : null;
    stmt.run(id, message.content, message.senderId, message.chatId, message.type, attachments, message.replyTo, now, now);
    
    // Update chat's updated_at timestamp
    this.updateChatTimestamp(message.chatId);
    
    // Initialize message status
    this.updateMessageStatus(id, 'sent');
    
    return this.getMessageById(id);
  }

  getMessageById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
    const message = stmt.get(id) as Message | undefined;
    if (message && message.attachments) {
      message.attachments = JSON.parse(message.attachments);
    }
    return message;
  }

  getMessagesByChatId(chatId: string, limit = 50, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const messages = stmt.all(chatId, limit, offset) as Message[];
    
    // Parse attachments JSON
    return messages.map(msg => {
      if (msg.attachments) {
        msg.attachments = JSON.parse(msg.attachments);
      }
      return msg;
    });
  }

  private updateChatTimestamp(chatId: string) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?');
    stmt.run(now, chatId);
  }

  // Message status operations
  updateMessageStatus(messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed') {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO message_status (message_id, status, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(messageId, status, now);
  }

  getMessageStatus(messageId: string) {
    const stmt = this.db.prepare('SELECT * FROM message_status WHERE message_id = ?');
    return stmt.get(messageId) as { message_id: string; status: string; updated_at: string } | undefined;
  }

  // Message receipt operations
  createMessageReceipt(messageId: string, userId: string, receiptType: 'delivered' | 'read') {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO message_receipts (id, message_id, user_id, receipt_type, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, messageId, userId, receiptType, now);
    
    // Update message status if it's a read receipt
    if (receiptType === 'read') {
      this.updateMessageStatus(messageId, 'read');
    } else {
      this.updateMessageStatus(messageId, 'delivered');
    }
  }

  getMessageReceipts(messageId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM message_receipts 
      WHERE message_id = ? 
      ORDER BY timestamp ASC
    `);
    return stmt.all(messageId) as Array<{
      id: string;
      message_id: string;
      user_id: string;
      receipt_type: string;
      timestamp: string;
    }>;
  }

  // User presence operations
  updateUserPresence(userId: string, status: 'online' | 'away' | 'offline', socketId?: string) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_presence (user_id, status, last_seen, socket_id)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, status, now, socketId);
  }

  getUserPresence(userId: string) {
    const stmt = this.db.prepare('SELECT * FROM user_presence WHERE user_id = ?');
    return stmt.get(userId) as {
      user_id: string;
      status: string;
      last_seen: string;
      socket_id: string | null;
    } | undefined;
  }

  getOnlineUsers() {
    const stmt = this.db.prepare('SELECT user_id FROM user_presence WHERE status = "online"');
    return stmt.all() as Array<{ user_id: string }>;
  }

  // Message queue operations
  queueMessageForUser(userId: string, messageId: string) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const nextAttempt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
    
    const stmt = this.db.prepare(`
      INSERT INTO message_queue (id, user_id, message_id, queued_at, next_attempt)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, messageId, now, nextAttempt);
  }

  getQueuedMessagesForUser(userId: string) {
    const stmt = this.db.prepare(`
      SELECT mq.*, m.* FROM message_queue mq
      JOIN messages m ON mq.message_id = m.id
      WHERE mq.user_id = ? AND mq.attempts < mq.max_attempts
      ORDER BY mq.queued_at ASC
    `);
    return stmt.all(userId) as Array<{
      id: string;
      user_id: string;
      message_id: string;
      queued_at: string;
      attempts: number;
      max_attempts: number;
      next_attempt: string;
      content: string;
      sender_id: string;
      chat_id: string;
      type: string;
      attachments: string | null;
      reply_to: string | null;
      created_at: string;
      updated_at: string;
    }>;
  }

  updateQueueAttempt(messageId: string, userId: string, attempts: number) {
    const nextAttempt = new Date(Date.now() + Math.pow(2, attempts) * 60 * 1000).toISOString(); // Exponential backoff
    const stmt = this.db.prepare(`
      UPDATE message_queue 
      SET attempts = ?, next_attempt = ? 
      WHERE message_id = ? AND user_id = ?
    `);
    stmt.run(attempts, nextAttempt, messageId, userId);
  }

  removeFromQueue(messageId: string, userId: string) {
    const stmt = this.db.prepare(`
      DELETE FROM message_queue 
      WHERE message_id = ? AND user_id = ?
    `);
    stmt.run(messageId, userId);
  }

  // Message read status (legacy - keeping for backward compatibility)
  markMessageAsRead(messageId: string, userId: string) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO message_reads (message_id, user_id)
      VALUES (?, ?)
    `);
    stmt.run(messageId, userId);
    
    // Also create a receipt for real-time tracking
    this.createMessageReceipt(messageId, userId, 'read');
  }

  getUnreadMessageCount(chatId: string, userId: string) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
      WHERE m.chat_id = ? AND m.sender_id != ? AND mr.message_id IS NULL
    `);
    const result = stmt.get(userId, chatId, userId) as { count: number };
    return result.count;
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

export const db = new DatabaseService();
