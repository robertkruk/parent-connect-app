import { useState } from 'react';
import { User } from '../types';
import { mockUsers } from '../data/mockData';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = () => {
    console.log('handleLogin called', { username, password });
    if (username && password) {
      // For demo purposes, find user by username (using name field as username)
      const user = mockUsers.find(u => u.name.toLowerCase() === username.toLowerCase());
      if (user) {
        console.log('User found, logging in:', user);
        onLogin(user);
      } else {
        console.log('User not found');
        alert('Invalid username or password. Please try again.');
      }
    } else {
      console.log('Missing username or password');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'Username:', username, 'Password:', password);
    if (e.key === 'Enter' && username && password) {
      console.log('Enter key pressed with valid credentials, calling handleLogin');
      e.preventDefault();
      handleLogin();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    console.log('Form submitted');
    e.preventDefault();
    handleLogin();
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
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                console.log('Password field key pressed:', e.key);
                if (e.key === 'Enter' && username && password) {
                  console.log('Enter in password field, submitting form');
                  e.preventDefault();
                  handleLogin();
                }
              }}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={!username || !password}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to ParentConnect
          </button>
        </form>

        {/* Demo Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Demo Accounts:</strong><br/>
            Username: "Sarah Johnson" (or any name from the list)<br/>
            Password: any password (demo mode)
          </p>
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
