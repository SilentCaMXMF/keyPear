// Dashboard Page - "Digital Ether" Design
import { auth } from '../utils/auth.js';
import { api } from '../utils/api.js';

const API_URL = 'http://localhost:3001';
let currentPath = '/';

export function dashboardPage() {
  const user = auth.getUser();
  
  return `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>KeyPear</h2>
          <p class="label-small">${user?.name || 'User'}</p>
        </div>
        
        <nav>
          <a href="#" class="nav-item active" data-page="files">
            <span style="margin-right: var(--space-3);">📁</span> My Files
          </a>
          <a href="#" class="nav-item" data-page="shared">
            <span style="margin-right: var(--space-3);">🔗</span> Shared with me
          </a>
          <a href="#" class="nav-item" data-page="recent">
            <span style="margin-right: var(--space-3);">🕐</span> Recent
          </a>
          <a href="#" class="nav-item" data-page="trash">
            <span style="margin-right: var(--space-3);">🗑️</span> Trash
          </a>
        </nav>
        
        <div>
          <a href="#" class="nav-item" data-action="logout">
            <span style="margin-right: var(--space-3);">🚪</span> Sign Out
          </a>
        </div>
      </aside>
      
      <main class="main-content">
        <div class="file-browser">
          <div class="toolbar">
            <button class="btn btn-primary" id="upload-btn">
              <span>+</span> Upload File
            </button>
            <button class="btn btn-secondary" id="new-folder-btn">
              <span>📂</span> New Folder
            </button>
            
            <div id="folder-input-container" style="display: none;">
              <input type="text" id="folder-name-input" placeholder="Folder name">
              <button class="btn btn-primary" id="create-folder-btn">Create</button>
              <button class="btn btn-tertiary" id="cancel-folder-btn">Cancel</button>
            </div>
            
            <span id="breadcrumb"></span>
          </div>
          
          <div class="dropzone" id="dropzone">
            <p>Drag and drop files here or click to upload</p>
            <input type="file" id="file-input" hidden multiple>
          </div>
          
          <ul class="file-list" id="file-list">
            <li style="text-align: center; padding: var(--space-8); color: var(--on-surface-variant);">
              Loading files...
            </li>
          </ul>
        </div>
      </main>
      
      <div id="context-menu" style="display: none;"></div>
    </div>
  `;
}

function formatSize(bytes) {
  if (!bytes) return '-';
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

function updateBreadcrumb() {
  const breadcrumb = document.getElementById('breadcrumb');
  if (!breadcrumb) return;
  
  if (currentPath === '/') {
    breadcrumb.textContent = 'My Files';
    return;
  }
  
  const parts = currentPath.split('/').filter(Boolean);
  breadcrumb.innerHTML = `<a href="#" data-path="/" style="color: inherit;">My Files</a>`;
  
  let path = '';
  for (const part of parts) {
    path += '/' + part;
    breadcrumb.innerHTML += ` <span style="color: var(--on-surface-variant);">/</span> <a href="#" data-path="${path}" style="color: inherit;">${part}</a>`;
  }
}

function renderFiles(files) {
  const list = document.getElementById('file-list');
  if (!list) return;
  
  updateBreadcrumb();
  
  if (!files || files.length === 0) {
    list.innerHTML = `
      <li style="text-align: center; padding: var(--space-8); color: var(--on-surface-variant);">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">📭</div>
        <p>No files yet. Upload something!</p>
      </li>
    `;
    return;
  }
  
  list.innerHTML = files.map(file => `
    <li class="file-item" data-id="${file.id}" data-type="${file.type}" data-name="${file.name}" data-path="${file.path || currentPath}">
      <div class="file-icon">${file.type === 'folder' ? '📁' : '📄'}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-meta">${formatSize(file.size)} • ${formatDate(file.createdAt)}</div>
      </div>
      <button class="file-delete-btn" data-id="${file.id}" data-name="${file.name}" title="Delete">×</button>
    </li>
  `).join('');
}

async function loadFiles() {
  try {
    const files = await api.getFiles(currentPath);
    renderFiles(files);
  } catch (err) {
    const list = document.getElementById('file-list');
    if (list) {
      list.innerHTML = `
        <li style="text-align: center; padding: var(--space-8); color: var(--error);">
          ${err.message}
        </li>
      `;
    }
  }
}

async function handleFiles(e) {
  const files = Array.from(e.target.files);
  for (const file of files) {
    try {
      await api.uploadFile(file, currentPath);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }
  loadFiles();
}

async function downloadFile(id, name) {
  try {
    const token = auth.getToken();
    const response = await fetch(`${API_URL}/api/files/${id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download error:', err);
    alert('Failed to download file');
  }
}

function showContextMenu(e, file) {
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  if (!menu) return;
  
  menu.innerHTML = `
    <div class="context-menu-item" data-action="open">📂 Open</div>
    ${file.type !== 'folder' ? '<div class="context-menu-item" data-action="download">⬇️ Download</div>' : ''}
    <div class="context-menu-item" data-action="rename">✏️ Rename</div>
    ${file.type !== 'folder' ? '<div class="context-menu-item" data-action="share">🔗 Share</div>' : ''}
    <div class="context-menu-divider"></div>
    <div class="context-menu-item danger" data-action="delete">🗑️ Delete</div>
  `;
  
  menu.style.display = 'block';
  menu.style.left = Math.min(e.pageX, window.innerWidth - 180) + 'px';
  menu.style.top = Math.min(e.pageY, window.innerHeight - 200) + 'px';
  menu.dataset.fileId = file.id;
  menu.dataset.fileType = file.type;
  menu.dataset.fileName = file.name;
}

function hideContextMenu() {
  const menu = document.getElementById('context-menu');
  if (menu) menu.style.display = 'none';
}

async function handleContextAction(action, fileId, fileType, fileName) {
  hideContextMenu();
  
  switch (action) {
    case 'open':
      if (fileType === 'folder') {
        currentPath = currentPath === '/' ? '/' + fileName : currentPath + '/' + fileName;
        loadFiles();
      }
      break;
      
    case 'download':
      downloadFile(fileId, fileName);
      break;
      
    case 'rename':
      const newName = prompt('Enter new name:', fileName);
      if (newName && newName !== fileName) {
        console.log('Rename', fileId, 'to', newName);
      }
      break;
      
    case 'share':
      try {
        const result = await api.createShareLink(fileId);
        const shareUrl = window.location.origin + '/share/' + result.token;
        alert('Share link: ' + shareUrl);
      } catch (err) {
        alert('Failed to create share link');
      }
      break;
      
    case 'delete':
      if (confirm('Delete "' + fileName + '"?')) {
        try {
          await api.deleteFile(fileId);
          loadFiles();
        } catch (err) {
          alert('Failed to delete: ' + err.message);
        }
      }
      break;
  }
}

export function initDashboardPage() {
  currentPath = '/';
  loadFiles();
  
  document.addEventListener('click', hideContextMenu);
  
  // Logout
  document.querySelector('[data-action="logout"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });
  
  // Nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  // Dropzone
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  
  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles({ target: { files: e.dataTransfer.files } });
  });
  
  document.getElementById('upload-btn')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', handleFiles);
  
  // Folder creation
  const newFolderBtn = document.getElementById('new-folder-btn');
  const folderContainer = document.getElementById('folder-input-container');
  const folderInput = document.getElementById('folder-name-input');
  
  newFolderBtn?.addEventListener('click', () => {
    folderContainer.style.display = 'inline-flex';
    folderInput?.focus();
  });
  
  document.getElementById('create-folder-btn')?.addEventListener('click', () => {
    const name = folderInput?.value.trim();
    if (name) {
      api.createFolder(name, currentPath).then(() => {
        if (folderInput) folderInput.value = '';
        folderContainer.style.display = 'none';
        loadFiles();
      }).catch(err => console.error('Create folder failed:', err));
    }
  });
  
  document.getElementById('cancel-folder-btn')?.addEventListener('click', () => {
    if (folderInput) folderInput.value = '';
    folderContainer.style.display = 'none';
  });
  
  folderInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('create-folder-btn')?.click();
    if (e.key === 'Escape') document.getElementById('cancel-folder-btn')?.click();
  });
  
  // Breadcrumb navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('#breadcrumb a');
    if (link) {
      e.preventDefault();
      currentPath = link.dataset.path;
      loadFiles();
    }
  });
  
  // File click
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.file-delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.id;
      const name = deleteBtn.dataset.name;
      if (confirm('Delete "' + name + '"?')) {
        api.deleteFile(id).then(() => loadFiles()).catch(err => alert('Failed: ' + err.message));
      }
      return;
    }
    
    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      const type = fileItem.dataset.type;
      const name = fileItem.dataset.name;
      const id = fileItem.dataset.id;
      
      if (type === 'folder') {
        currentPath = currentPath === '/' ? '/' + name : currentPath + '/' + name;
        loadFiles();
      } else {
        downloadFile(id, name);
      }
    }
  });
  
  // Context menu
  document.addEventListener('contextmenu', (e) => {
    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      showContextMenu(e, {
        id: fileItem.dataset.id,
        type: fileItem.dataset.type,
        name: fileItem.dataset.name
      });
    }
  });
  
  document.getElementById('context-menu')?.addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item');
    if (item) {
      e.preventDefault();
      const menu = document.getElementById('context-menu');
      handleContextAction(item.dataset.action, menu.dataset.fileId, menu.dataset.fileType, menu.dataset.fileName);
    }
  });
}
