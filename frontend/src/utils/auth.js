// Auth Utilities
const TOKEN_KEY = 'keypear_token';
const USER_KEY = 'keypear_user';

export const auth = {
  isLoggedIn() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  async login(email, password) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data;
  },
  
  async register(name, email, password) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    const data = await response.json();
    return data;
  },
  
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  }
};
