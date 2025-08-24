import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Menu, MoreVertical, Users, Shield } from 'lucide-react';
import { User, Message } from '../types';
import { mockChats, mockUsers, mockChildren, mockMessages } from '../data/mockData';
import { formatTime, getInitials } from '../lib/utils';

interface ChatWindowProps {
  currentUser: User;
  onMenuClick: () => void;
}

export default function ChatWindow({ currentUser, onMenuClick }: ChatWindowProps) {
  const { chatId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showChatInfo, setShowChatInfo] = useState(false);

  const chat = mockChats.find(c => c.id === chatId);
  const chatMessages = mockMessages.filter(m => m.chatId === chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && chat) {
      // In a real app, this would send to a backend
      console.log('Sending message:', newMessage);
      setNewMessage('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderName = (senderId: string) => {
    const sender = mockUsers.find(u => u.id === senderId);
    if (sender) {
      const senderChild = mockChildren.find(c => c.parentId === senderId);
      return senderChild ? `${sender.name} (${senderChild.name}'s parent)` : sender.name;
    }
    return 'Unknown';
  };

  const getChatParticipants = () => {
    if (!chat) return [];
    return chat.participants
      .map(participantId => mockUsers.find(user => user.id === participantId))
      .filter(Boolean) as User[];
  };

  const getChatDisplayName = () => {
    if (!chat) return '';
    if (chat.type === 'class') {
      return chat.name;
    } else if (chat.type === 'direct') {
      const otherParticipant = getChatParticipants().find(p => p.id !== currentUser.id);
      return otherParticipant?.name || 'Unknown User';
    }
    return chat.name;
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Chat not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">
              {getInitials(getChatDisplayName())}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{getChatDisplayName()}</h2>
            <p className="text-sm text-gray-500">
              {chat.type === 'class' ? 'Class Chat' : 'Direct message'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowChatInfo(!showChatInfo)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Chat information"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Chat Info Panel */}
      {showChatInfo && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">Chat Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Participants:</p>
              <div className="mt-2 space-y-2">
                {getChatParticipants().map(participant => {
                  const child = mockChildren.find(c => c.parentId === participant.id);
                  return (
                    <div key={participant.id} className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700">
                          {getInitials(participant.name)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {participant.name}
                        {child && ` (${child.name}'s parent)`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {chat.type === 'class' && (
              <div>
                <p className="text-sm font-medium text-gray-700">Class:</p>
                <p className="text-sm text-gray-600">{chat.name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map(message => {
            const isOwnMessage = message.senderId === currentUser.id;
            const sender = mockUsers.find(u => u.id === message.senderId);
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700">
                          {getInitials(sender?.name || 'Unknown')}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {getSenderName(message.senderId)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg ${
                      isOwnMessage
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                setIsTyping(e.target.value.length > 0);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
