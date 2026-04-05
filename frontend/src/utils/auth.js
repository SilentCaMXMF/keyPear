// Auth Utilities
const TOKEN_KEY = 'keypear_token';
const REFRESH_KEY = 'keypear_refresh_token';
const USER_KEY = 'keypear_user';

const getApiUrl = () => {
  const envUrl = import.meta.env?.VITE_API_URL
    || import.meta.env?.VITE_API_BASE_URL
    || import.meta.env?.PUBLIC_API_URL
    || '';

  return envUrl.replace(/\/$/, '');
};

const API_URL = getApiUrl();

export const auth = {
  isLoggedIn() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },

  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async loginWithWallet(address, signature, message, name) {
    const response = await fetch(`${API_URL}/api/auth/web3/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature, message, name })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid response: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Authentication failed');
    }

    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
    }

    return data;
  },

  async updateProfile({ name }) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    const user = this.getUser();
    if (user) {
      Object.assign(user, data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  }
};
