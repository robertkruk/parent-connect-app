import { useState } from 'react';
import { Search, Plus, Settings, Shield } from 'lucide-react';
import type { User as UserType, Chat } from '../types';
import { mockChats, mockUsers, mockChildren } from '../data/mockData';
import { formatTime, getInitials } from '../lib/utils';
import { useChatStore } from '../stores/chatStore';
import Avatar from './Avatar';

interface ChatSidebarProps {
  currentUser: UserType;
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
}

export default function ChatSidebar({ currentUser, onChatSelect, selectedChatId }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { onlineUsers } = useChatStore();

  // Get user's children
  const userChildren = mockChildren.filter(child => child.parentId === currentUser.id);
  
  // Filter chats based on search query
  const filteredChats = mockChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChatParticipants = (chat: Chat) => {
    return chat.participants
      .map(participantId => mockUsers.find(user => user.id === participantId))
      .filter(Boolean) as UserType[];
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'class') {
      return chat.name;
    } else if (chat.type === 'direct') {
      const participants = getChatParticipants(chat);
      const otherParticipant = participants.find(p => p.id !== currentUser.id);
      return otherParticipant?.name || 'Unknown User';
    }
    return chat.name;
  };

  const getChatSubtitle = (chat: Chat) => {
    if (chat.type === 'class') {
      const classInfo = chat.classId ? `Class Chat` : '';
      return classInfo;
    } else if (chat.type === 'direct') {
      const otherParticipant = getChatParticipants(chat).find(p => p.id !== currentUser.id);
      const otherChild = mockChildren.find(child => child.parentId === otherParticipant?.id);
      return otherChild ? `${otherChild.name}'s parent` : 'Direct message with parent';
    }
    return `${chat.participants.length} participants`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">ParentConnect</h1>
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Add new chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            size="lg" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3 text-success-500" />
              <p className="text-xs text-gray-500">Verified Parent</p>
            </div>
          </div>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="User settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        
        {/* Children Info */}
        {userChildren.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-700 mb-2">Your Children:</p>
            <div className="space-y-1">
              {userChildren.map(child => (
                <div key={child.id} className="flex items-center space-x-2">
                  <Avatar 
                    src={child.avatar} 
                    alt={child.name} 
                    size="sm" 
                    className="bg-primary-100"
                  />
                  <span className="text-xs text-gray-600">{child.name} - {child.grade}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No chats found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredChats.map(chat => {
              // Get other participants in the chat (excluding current user)
              const otherParticipants = chat.participants.filter(p => p !== currentUser.id);
              
              // Check if any other participants are online
              const onlineParticipants = otherParticipants.filter(userId => onlineUsers.has(userId));
              const isAnyOtherUserOnline = onlineParticipants.length > 0;
              
              return (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                    selectedChatId === chat.id ? 'bg-primary-50 border border-primary-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 relative">
                      <span className="text-sm font-medium text-primary-700">
                        {getInitials(getChatDisplayName(chat))}
                      </span>
                      {chat.type === 'direct' && (
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          isAnyOtherUserOnline ? 'bg-green-400' : 'bg-gray-400'
                        }`} title={isAnyOtherUserOnline ? 'Online' : 'Offline'}></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {getChatDisplayName(chat)}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {getChatSubtitle(chat)}
                        {chat.type === 'direct' && isAnyOtherUserOnline && (
                          <span className="ml-1 text-green-600">• Online</span>
                        )}
                      </p>
                      {chat.lastMessage && (
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {chat.lastMessage.content}
                        </p>
                      )}
                      {chat.unreadCount > 0 && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {chat.unreadCount} unread
                          </span>
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
