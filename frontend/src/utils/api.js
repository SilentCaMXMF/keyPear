import { auth } from './auth.js';

const getApiUrl = () => {
  const url = import.meta.env?.VITE_API_URL || 'http://localhost:3001';
  return url.replace(/\/$/, '');
};
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
    const refreshToken = auth.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('keypear_token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('keypear_refresh_token', data.refreshToken);
          }
          // Retry original request
          return fetchWithAuth(url, options);
        }
      } catch (e) {
        // Fall through to logout
      }
    }
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
  async getFiles(folderId = null, { search = '', sort = 'created_at', order = 'DESC' } = {}) {
    const params = new URLSearchParams();
    if (folderId) params.set('folderId', folderId);
    if (search) params.set('search', search);
    params.set('sort', sort);
    params.set('order', order);
    
    const url = `${API_URL}/api/files?${params.toString()}`;
    return fetchWithAuth(url);
  },
  
  async updateFile(id, data) {
    return fetchWithAuth(`${API_URL}/api/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  async copyFile(id, folderId = null) {
    return fetchWithAuth(`${API_URL}/api/files/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify({ folderId }),
    });
  },
  
  async bulkDelete(fileIds) {
    return fetchWithAuth(`${API_URL}/api/files/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ fileIds }),
    });
  },
  
  async uploadFile(file, folderId = null, onProgress = null) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folderId', folderId);
      
      const token = auth.getToken();
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Invalid response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      
      xhr.open('POST', `${API_URL}/api/files/upload`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },
  
  async deleteFile(id, permanent = false) {
    return fetchWithAuth(`${API_URL}/api/files/${id}?permanent=${permanent}`, { 
      method: 'DELETE' 
    });
  },
  
  async restoreFile(id) {
    return fetchWithAuth(`${API_URL}/api/files/${id}/restore`, { method: 'POST' });
  },
  
  async downloadFile(id, filename) {
    const token = auth.getToken();
    const response = await fetch(`${API_URL}/api/files/${id}/download`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  
  async createFolder(name, parentFolderId = null) {
    return fetchWithAuth(`${API_URL}/api/folders`, {
      method: 'POST',
      body: JSON.stringify({ name, parentFolderId }),
    });
  },
  
  async updateFolder(id, data) {
    return fetchWithAuth(`${API_URL}/api/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  async copyFolder(id, parentFolderId = null) {
    return fetchWithAuth(`${API_URL}/api/folders/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify({ parentFolderId }),
    });
  },
  
  async deleteFolder(id, permanent = false) {
    return fetchWithAuth(`${API_URL}/api/folders/${id}?permanent=${permanent}`, { 
      method: 'DELETE' 
    });
  },
  
  async getFolderTree() {
    return fetchWithAuth(`${API_URL}/api/folders/tree`);
  },
  
  async getFolders(folderId = null, search = '') {
    const params = new URLSearchParams();
    if (folderId) params.set('parentFolderId', folderId);
    if (search) params.set('search', search);
    
    const url = `${API_URL}/api/folders?${params.toString()}`;
    return fetchWithAuth(url);
  },
  
  async getTrashFolders() {
    return fetchWithAuth(`${API_URL}/api/folders/trash`);
  },
  
  async restoreFolder(id) {
    return fetchWithAuth(`${API_URL}/api/folders/${id}/restore`, { method: 'POST' });
  },
  
  async getUser() {
    return fetchWithAuth(`${API_URL}/api/auth/me`);
  },
  
  async createShareLink(fileId, expiresIn, sharedWithEmail = null) {
    return fetchWithAuth(`${API_URL}/api/shares`, {
      method: 'POST',
      body: JSON.stringify({ fileId, expiresIn, sharedWithEmail }),
    });
  },
  
  async getTrash() {
    return fetchWithAuth(`${API_URL}/api/files/trash`);
  },
  
  async getRecentFiles(limit = 50) {
    return fetchWithAuth(`${API_URL}/api/files/recent?limit=${limit}`);
  },
  
  async getSharedLinks() {
    return fetchWithAuth(`${API_URL}/api/shares`);
  },
  
  async getSharedWithMe() {
    return fetchWithAuth(`${API_URL}/api/shares/shared-with-me`);
  },
};
