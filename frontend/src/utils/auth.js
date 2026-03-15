// Auth Utilities
const TOKEN_KEY = 'keypear_token';
const USER_KEY = 'keypear_user';

// Get API URL - VITE_API_URL must be set in Vercel project settings
function getApiUrl() {
  // Try Vite env var (set at build time by Vercel)
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined;
  if (viteUrl) return viteUrl;
  
  // Fallback for local dev
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  
  // Default fallback - this would be wrong in production
  return 'http://localhost:3001';
}

const API_URL = getApiUrl();

// Debug: log the API URL being used
if (typeof window !== 'undefined') {
  console.log('KeyPear API URL:', API_URL);
}

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
