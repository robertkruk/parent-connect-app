import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { apiService, type User } from './services/api';
import { RealtimeChatLayout } from './components/RealtimeChatLayout';
import ParentConnectIcon from './components/ParentConnectIcon';

// Enhanced mock data with proper credentials for demo
const mockUsers = [
  { 
    id: '40e8b510-17bc-418e-894a-0d363f8758e7', 
    name: 'Sarah Johnson', 
    email: 'sarah.johnson@email.com', 
    phone: '+1-555-0123',
    password: 'password123',
    pin: '1234',
    isVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=1',
    createdAt: new Date('2024-01-15'),
    children: [{
      id: 'emma-johnson',
      name: 'Emma Johnson',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: '40e8b510-17bc-418e-894a-0d363f8758e7'
    }]
  },
  { 
    id: 'a9836588-2316-4360-a670-ca306b5f3d57', 
    name: 'Michael Chen', 
    email: 'michael.chen@email.com', 
    phone: '+1-555-0124',
    password: 'password123',
    pin: '5678',
    isVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=2',
    createdAt: new Date('2024-01-16'),
    children: [{
      id: 'alex-chen',
      name: 'Alex Chen',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: 'a9836588-2316-4360-a670-ca306b5f3d57'
    }]
  },
  { 
    id: '5daf3326-c042-4ad9-a53b-3baaed0533e5', 
    name: 'Emily Rodriguez', 
    email: 'emily.rodriguez@email.com', 
    phone: '+1-555-0125',
    password: 'password123',
    pin: '9012',
    isVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=3',
    createdAt: new Date('2024-01-17'),
    children: [{
      id: 'sophia-rodriguez',
      name: 'Sophia Rodriguez',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: '5daf3326-c042-4ad9-a53b-3baaed0533e5'
    }]
  },
  { 
    id: '3b6873f7-a3b6-4773-b26d-6ba7c5d82b36', 
    name: 'David Thompson', 
    email: 'david.thompson@email.com', 
    phone: '+1-555-0126',
    password: 'password123',
    pin: '3456',
    isVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=4',
    createdAt: new Date('2024-01-18'),
    children: [{
      id: 'james-thompson',
      name: 'James Thompson',
      grade: '4th Grade',
      school: 'Lincoln Elementary',
      parentId: '3b6873f7-a3b6-4773-b26d-6ba7c5d82b36'
    }]
  },
  { 
    id: '162b123d-d09d-4e22-b061-19479110e5f6', 
    name: 'Lisa Wang', 
    email: 'lisa.wang@email.com', 
    phone: '+1-555-0127',
    password: 'password123',
    pin: '7890',
    isVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=5',
    createdAt: new Date('2024-01-19'),
    children: [{
      id: 'mia-wang',
      name: 'Mia Wang',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: '162b123d-d09d-4e22-b061-19479110e5f6'
    }]
  },
];

// Enhanced Login Page Component
function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    if (!identifier || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      if (loginMethod === 'email') {
        // Use real API for email login
        response = await apiService.login(identifier, password);
      } else {
        // For mobile login, we'll need to implement a separate endpoint
        // For now, we'll use the mock data as fallback
        const user = mockUsers.find(u => u.phone === identifier && u.pin === password);
        if (user) {
          // Generate a mock JWT token for the user
          const mockToken = `mock-jwt-token-${user.id}`;
          apiService.setToken(mockToken);
          onLogin(user);
          setIsLoading(false);
          return;
        } else {
          setError('Invalid credentials. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      if (response && response.user) {
        onLogin(response.user);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '1rem' 
          }}>
            <ParentConnectIcon size="xl" />
          </div>
          <h1 style={{ color: '#333', marginBottom: '0.5rem', fontSize: '2rem' }}>
            ParentConnect
          </h1>
          <p style={{ color: '#666' }}>
            Safe communication for school parents
          </p>
        </div>

        {/* Login Method Toggle */}
        <div style={{ 
          display: 'flex', 
          background: '#f5f5f5', 
          borderRadius: '0.5rem', 
          padding: '0.25rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => {
              setLoginMethod('email');
              setShowPin(false);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '0.25rem',
              background: loginMethod === 'email' ? '#667eea' : 'transparent',
              color: loginMethod === 'email' ? 'white' : '#666',
              cursor: 'pointer'
            }}
          >
            Email
          </button>
          <button
            onClick={() => {
              setLoginMethod('phone');
              setShowPin(true);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '0.25rem',
              background: loginMethod === 'phone' ? '#667eea' : 'transparent',
              color: loginMethod === 'phone' ? 'white' : '#666',
              cursor: 'pointer'
            }}
          >
            Mobile
          </button>
        </div>

        {/* Login Form */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 'bold' }}>
              {loginMethod === 'email' ? 'Email Address' : 'Mobile Number'}
            </label>
            <input
              type={loginMethod === 'email' ? 'email' : 'tel'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={loginMethod === 'email' ? 'sarah.johnson@email.com' : '+1-555-0123'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 'bold' }}>
              {showPin ? 'PIN Code' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={showPin ? 'Enter 4-digit PIN' : 'Enter password'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{ 
              color: '#dc2626', 
              fontSize: '0.875rem', 
              marginBottom: '1rem',
              padding: '0.5rem',
              background: '#fef2f2',
              borderRadius: '0.25rem',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!identifier || !password || isLoading}
            style={{
              width: '100%',
              background: (identifier && password && !isLoading) ? '#667eea' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: (identifier && password && !isLoading) ? 'pointer' : 'not-allowed'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>

        {/* Demo Accounts */}
        <div style={{ 
          borderTop: '1px solid #e0e0e0', 
          paddingTop: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            color: '#333', 
            fontSize: '1rem', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Demo Accounts
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
            <p style={{ marginBottom: '0.5rem' }}><strong>Email Login:</strong></p>
            <p style={{ marginBottom: '0.25rem' }}>• sarah.johnson@email.com / password123</p>
            <p style={{ marginBottom: '0.25rem' }}>• michael.chen@email.com / password123</p>
            <p style={{ marginBottom: '0.5rem' }}>• emily.rodriguez@email.com / password123</p>
            
            <p style={{ marginBottom: '0.5rem' }}><strong>Mobile Login:</strong></p>
            <p style={{ marginBottom: '0.25rem' }}>• +1-555-0123 / 1234</p>
            <p style={{ marginBottom: '0.25rem' }}>• +1-555-0124 / 5678</p>
            <p>• +1-555-0125 / 9012</p>
          </div>
        </div>

        <p style={{ 
          fontSize: '0.75rem', 
          color: '#999', 
          textAlign: 'center' 
        }}>
          By continuing, you agree to our community guidelines and privacy policy.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await apiService.autoLogin();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    apiService.clearToken();
  };

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  return (
    <Router>
      <RealtimeChatLayout currentUser={currentUser} onLogout={handleLogout} />
    </Router>
  );
}

export default App;
