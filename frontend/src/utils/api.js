// API Utilities
import { auth } from './auth.js';

// Get API URL - VITE_API_URL must be set in Vercel project settings
function getApiUrl() {
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined;
  if (viteUrl) return viteUrl;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  return 'http://localhost:3001';
}

const API_URL = getApiUrl();

async function fetchWithAuth(url, options = {}) {
  const token = auth.getToken();
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    auth.logout();
    throw new Error('Session expired');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

export const api = {
  // Files
  async getFiles(path = '/') {
    return fetchWithAuth(`${API_URL}/api/files?path=${encodeURIComponent(path)}`);
  },
  
  async uploadFile(file, path = '/') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    
    const token = auth.getToken();
    const response = await fetch(`${API_URL}/api/files/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    
    return response.json();
  },
  
  async deleteFile(id) {
    return fetchWithAuth(`${API_URL}/api/files/${id}`, { method: 'DELETE' });
  },
  
  async createFolder(name, path = '/') {
    return fetchWithAuth(`${API_URL}/api/folders`, {
      method: 'POST',
      body: JSON.stringify({ name, path }),
    });
  },
  
  // User
  async getUser() {
    return fetchWithAuth(`${API_URL}/api/auth/me`);
  },
  
  // Share
  async createShareLink(fileId, expiresIn) {
    return fetchWithAuth(`${API_URL}/api/share`, {
      method: 'POST',
      body: JSON.stringify({ fileId, expiresIn }),
    });
  },
  
  async getShareLinks(fileId) {
    return fetchWithAuth(`${API_URL}/api/share/file/${fileId}`);
  },
  
  async deleteShareLink(linkId) {
    return fetchWithAuth(`${API_URL}/api/share/${linkId}`, { method: 'DELETE' });
  },
};
