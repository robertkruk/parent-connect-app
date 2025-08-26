export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  parentId: string;
  avatar?: string;
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
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
  attachments?: string[];
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

export interface ParentWithChildren extends User {
  children: Child[];
}

export interface ChatWithParticipants {
  id: string;
  name: string;
  type: 'class' | 'direct' | 'group';
  participants: ParentWithChildren[];
  classId?: string; // For class chats
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}
