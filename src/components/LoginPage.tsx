import { useState } from 'react';
import { User } from '../types';
import { mockUsers } from '../data/mockData';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleLogin = () => {
    if (selectedUser) {
      const user = mockUsers.find(u => u.id === selectedUser);
      if (user) {
        onLogin(user);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-full">
              <span className="text-white text-2xl">💬</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ParentConnect
          </h1>
          <p className="text-gray-600">
            Safe communication for school parents
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-green-500 text-lg">🛡️</span>
            <span className="text-sm text-gray-700">Verified parent accounts</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-blue-500 text-lg">👥</span>
            <span className="text-sm text-gray-700">Connect with your child's class</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-red-500 text-lg">❤️</span>
            <span className="text-sm text-gray-700">Safe and moderated environment</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select your account
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a parent account...</option>
              {mockUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedUser}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to ParentConnect
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our community guidelines and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
