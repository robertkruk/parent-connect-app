import { useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import { User } from '../types';

interface ChatLayoutProps {
  currentUser: User;
}

export default function ChatLayout({ currentUser }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { chatId } = useParams();

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-80 lg:w-96 bg-white border-r border-gray-200`}>
        <ChatSidebar 
          currentUser={currentUser} 
          onChatSelect={handleChatSelect}
          selectedChatId={chatId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route 
            path="/chat/:chatId" 
            element={
              <ChatWindow 
                currentUser={currentUser}
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              />
            } 
          />
          <Route 
            path="/" 
            element={
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">👋</div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Welcome to ParentConnect
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Select a chat from the sidebar to start connecting with other parents
                  </p>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
                  >
                    Open Chats
                  </button>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}
