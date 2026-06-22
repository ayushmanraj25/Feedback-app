import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [toasts, setToasts] = useState([]);
  // Load auth state from localStorage on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const loginUser = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    addToast(`Welcome back, ${user.name}!`, 'success');
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    addToast('Logged out successfully.', 'info');
  };

  // Base API call helper
  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Call error [${endpoint}]:`, err);
      throw err;
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {token && user ? (
        <Dashboard 
          user={user} 
          token={token} 
          logout={logoutUser} 
          addToast={addToast} 
          apiCall={apiCall}
        />
      ) : (
        <Login 
          loginSuccess={loginUser} 
          addToast={addToast} 
          apiCall={apiCall}
        />
      )}
    </div>
  );
}
export default App;
