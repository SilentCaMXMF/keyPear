// Settings Page
import { auth } from '../utils/auth.js';

export function settingsPage() {
  const user = auth.getUser();
  
  return `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>KeyPear</h2>
          <p style="font-size: 0.875rem; color: var(--text-light)">${user?.name || 'User'}</p>
        </div>
        
        <nav>
          <a href="/dashboard" class="nav-item" data-page="files">My Files</a>
          <a href="/settings" class="nav-item active" data-page="settings">Settings</a>
        </nav>
        
        <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border);">
          <a href="#" class="nav-item" data-action="logout">Sign Out</a>
        </div>
      </aside>
      
      <main class="main-content">
        <div class="settings-container">
          <h1>Settings</h1>
          
          <div class="settings-section">
            <h2>Profile</h2>
            <form id="profile-form">
              <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" value="${user?.name || ''}" required>
              </div>
              
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" value="${user?.email || ''}" disabled>
                <small style="color: var(--text-light)">Email cannot be changed</small>
              </div>
              
              <button type="submit" class="btn" style="width: auto;">Save Changes</button>
            </form>
            <div id="profile-message"></div>
          </div>
          
          <div class="settings-section">
            <h2>Change Password</h2>
            <form id="password-form">
              <div class="form-group">
                <label for="current-password">Current Password</label>
                <input type="password" id="current-password" name="currentPassword" required>
              </div>
              
              <div class="form-group">
                <label for="new-password">New Password</label>
                <input type="password" id="new-password" name="newPassword" required minlength="6">
                <small style="color: var(--text-light)">Minimum 6 characters</small>
              </div>
              
              <button type="submit" class="btn" style="width: auto;">Change Password</button>
            </form>
            <div id="password-message"></div>
          </div>
          
          <div class="settings-section">
            <h2>Storage</h2>
            <div class="storage-info">
              <div class="storage-bar">
                <div class="storage-used" id="storage-used-bar" style="width: 0%"></div>
              </div>
              <p id="storage-text">Loading...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
    
    <script>
      // Load user data
      loadUserData();
      
      // Handle logout
      document.querySelector('[data-action="logout"]').addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
      });
      
      async function loadUserData() {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const token = localStorage.getItem('keypear_token');
          
          const response = await fetch(API_URL + '/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          
          if (!response.ok) throw new Error('Failed to load user');
          
          const user = await response.json();
          
          // Update form
          document.getElementById('name').value = user.name;
          document.getElementById('email').value = user.email;
          
          // Update storage display
          const usedGB = (user.storageUsed / 1024 / 1024 / 1024).toFixed(2);
          const quotaGB = (user.storageQuota / 1024 / 1024 / 1024).toFixed(0);
          const percent = Math.min(100, (user.storageUsed / user.storageQuota) * 100);
          
          document.getElementById('storage-used-bar').style.width = percent + '%';
          document.getElementById('storage-text').textContent = 
            usedGB + ' GB used of ' + quotaGB + ' GB';
        } catch (err) {
          console.error(err);
        }
      }
      
      // Profile form
      document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const messageDiv = document.getElementById('profile-message');
        
        btn.disabled = true;
        btn.textContent = 'Saving...';
        
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const token = localStorage.getItem('keypear_token');
          const name = document.getElementById('name').value;
          
          const response = await fetch(API_URL + '/api/auth/me', {
            method: 'PATCH',
            headers: { 
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
          });
          
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to update');
          }
          
          const user = await response.json();
          
          // Update local storage
          localStorage.setItem('keypear_user', JSON.stringify(user));
          
          messageDiv.innerHTML = '<div class="success">Profile updated successfully!</div>';
          document.querySelector('.sidebar-header p').textContent = user.name;
        } catch (err) {
          messageDiv.innerHTML = '<div class="error">' + err.message + '</div>';
        }
        
        btn.disabled = false;
        btn.textContent = 'Save Changes';
      });
      
      // Password form
      document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const messageDiv = document.getElementById('password-message');
        
        btn.disabled = true;
        btn.textContent = 'Changing...';
        
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const token = localStorage.getItem('keypear_token');
          
          const currentPassword = document.getElementById('current-password').value;
          const newPassword = document.getElementById('new-password').value;
          
          const response = await fetch(API_URL + '/api/auth/change-password', {
            method: 'POST',
            headers: { 
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
          });
          
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to change password');
          }
          
          messageDiv.innerHTML = '<div class="success">Password changed successfully!</div>';
          e.target.reset();
        } catch (err) {
          messageDiv.innerHTML = '<div class="error">' + err.message + '</div>';
        }
        
        btn.disabled = false;
        btn.textContent = 'Change Password';
      });
    </script>
    
    <style>
      .settings-container {
        max-width: 600px;
      }
      
      .settings-section {
        background: var(--surface);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }
      
      .settings-section h2 {
        margin-bottom: 1rem;
        font-size: 1.25rem;
      }
      
      .storage-info {
        margin-top: 1rem;
      }
      
      .storage-bar {
        height: 8px;
        background: var(--border);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }
      
      .storage-used {
        height: 100%;
        background: var(--primary);
        transition: width 0.3s;
      }
    </style>
  `;
}
