// API Utilities
import { auth } from './auth.js';

// Use localhost:3001 for dev, env var for production
const API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:3001';

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
  async getFiles(folderId = null) {
    const [filesRes, foldersRes] = await Promise.all([
      fetchWithAuth(`${API_URL}/api/files?folderId=${folderId || ''}`),
      fetchWithAuth(`${API_URL}/api/folders?parentFolderId=${folderId || ''}`)
    ]);
    
    const files = (filesRes.files || []).map(f => ({ ...f, type: 'file' }));
    const folders = (foldersRes.folders || []).map(f => ({ ...f, type: 'folder' }));
    
    return [...folders, ...files];
  },
  
  async uploadFile(file, folderId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    
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
  
  async createFolder(name, parentFolderId = null) {
    return fetchWithAuth(`${API_URL}/api/folders`, {
      method: 'POST',
      body: JSON.stringify({ name, parentFolderId }),
    });
  },
  
  async deleteFolder(id) {
    return fetchWithAuth(`${API_URL}/api/folders/${id}`, { method: 'DELETE' });
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
