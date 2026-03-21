// Auth Utilities
const TOKEN_KEY = 'keypear_token';
const USER_KEY = 'keypear_user';

// API URL - use environment variable or fallback
const getApiUrl = () => {
  // Try different env var names
  const envUrl = import.meta.env?.VITE_API_URL 
    || import.meta.env?.VITE_API_BASE_URL
    || import.meta.env?.PUBLIC_API_URL
    || '';
  
  // Remove trailing slash
  return envUrl.replace(/\/$/, '');
};

const API_URL = getApiUrl();
console.log('API URL:', API_URL);

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
    const url = `${API_URL}/api/auth/login`;
    console.log('Login URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const text = await response.text();
    console.log('Login response:', text.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid response: ${text.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Login failed');
    }
    
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data;
  },
  
  async register(name, email, password) {
    const url = `${API_URL}/api/auth/register`;
    console.log('Register URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid response: ${text.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Registration failed');
    }
    
    return data;
  },
  
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  }
};
