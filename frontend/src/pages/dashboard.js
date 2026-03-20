// Dashboard Page
import { auth } from '../utils/auth.js';
import { api } from '../utils/api.js';

export function dashboardPage() {
  const user = auth.getUser();
  
  return `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>KeyPear</h2>
          <p style="font-size: 0.875rem; color: var(--text-light)">${user?.name || 'User'}</p>
        </div>
        
        <nav>
          <a href="#" class="nav-item active" data-page="files">My Files</a>
          <a href="#" class="nav-item" data-page="shared">Shared with me</a>
          <a href="#" class="nav-item" data-page="recent">Recent</a>
          <a href="#" class="nav-item" data-page="trash">Trash</a>
        </nav>
        
        <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border);">
          <a href="#" class="nav-item" data-action="logout">Sign Out</a>
        </div>
      </aside>
      
      <main class="main-content">
        <div class="file-browser">
          <div class="toolbar">
            <button class="btn" style="width: auto;" id="upload-btn">Upload File</button>
            <button class="btn" style="width: auto;" id="new-folder-btn">New Folder</button>
            <span style="margin-left: auto; align-self: center; color: var(--text-light);">
              <span id="breadcrumb">My Files</span>
            </span>
          </div>
          
          <div class="dropzone" id="dropzone">
            <p>Drag and drop files here or click to upload</p>
            <input type="file" id="file-input" hidden multiple>
          </div>
          
          <ul class="file-list" id="file-list">
            <li style="text-align: center; padding: 2rem; color: var(--text-light);">
              Loading files...
            </li>
          </ul>
        </div>
      </main>
    </div>
    
    <script>
      // Load files on page load
      loadFiles();
      
      // Handle logout
      document.querySelector('[data-action="logout"]').addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
      });
      
      async function loadFiles() {
        try {
          const files = await api.getFiles();
          renderFiles(files);
        } catch (err) {
          document.getElementById('file-list').innerHTML = 
            '<li style="text-align: center; padding: 2rem; color: var(--error);">' + 
            err.message + '</li>';
        }
      }
      
      function renderFiles(files) {
        if (!files || files.length === 0) {
          document.getElementById('file-list').innerHTML = 
            '<li style="text-align: center; padding: 2rem; color: var(--text-light);">' +
            'No files yet. Upload something!</li>';
          return;
        }
        
        document.getElementById('file-list').innerHTML = files.map(file => `
          <li class="file-item" data-id="${file.id}" data-type="${file.type}">
            <div class="file-icon">${file.type === 'folder' ? '📁' : '📄'}</div>
            <div class="file-info">
              <div class="file-name">${file.name}</div>
              <div class="file-meta">${formatSize(file.size)} • ${formatDate(file.createdAt)}</div>
            </div>
          </li>
        `).join('');
      }
      }
      
      function formatSize(bytes) {
        if (!bytes) return '—';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
          bytes /= 1024;
          i++;
        }
        return bytes.toFixed(1) + ' ' + units[i];
      }
      
      function formatDate(date) {
        return new Date(date).toLocaleDateString();
      }
      
      // Upload handling
      const dropzone = document.getElementById('dropzone');
      const fileInput = document.getElementById('file-input');
      
      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', handleFiles);
      
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });
      
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFiles({ target: { files: e.dataTransfer.files } });
      });
      
      async function handleFiles(e) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          try {
            await api.uploadFile(file);
          } catch (err) {
            alert('Upload failed: ' + err.message);
          }
        }
        loadFiles();
      }
    </script>
  `;
}
