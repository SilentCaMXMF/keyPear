// Dashboard Page
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
            <button class="btn" id="upload-btn">Upload File</button>
            <button class="btn" id="new-folder-btn">New Folder</button>
            <div id="folder-input-container" style="display: none; margin-left: 0.5rem;">
              <input type="text" id="folder-name-input" placeholder="Folder name" style="padding: 0.25rem; border: 1px solid var(--border); border-radius: 4px;">
              <button class="btn" id="create-folder-btn" style="margin-left: 0.25rem;">Create</button>
              <button class="btn" id="cancel-folder-btn" style="margin-left: 0.25rem; background: var(--bg-secondary);">Cancel</button>
            </div>
            <span id="breadcrumb" style="margin-left: auto; color: var(--text-light);"></span>
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
      
      <div id="context-menu" class="context-menu" style="display: none; position: fixed; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 4px; padding: 0.5rem 0; min-width: 150px; z-index: 1000;">
        <a href="#" class="context-menu-item" data-action="open">Open</a>
        <a href="#" class="context-menu-item" data-action="download">Download</a>
        <a href="#" class="context-menu-item" data-action="rename">Rename</a>
        <a href="#" class="context-menu-item" data-action="share">Share</a>
        <div style="border-top: 1px solid var(--border); margin: 0.25rem 0;"></div>
        <a href="#" class="context-menu-item" data-action="delete" style="color: var(--error);">Delete</a>
      </div>
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
  breadcrumb.innerHTML = `<a href="#" data-path="/" style="color: inherit; text-decoration: none;">My Files</a>`;
  
  let path = '';
  for (const part of parts) {
    path += '/' + part;
    breadcrumb.innerHTML += ` <span style="margin: 0 0.25rem;">/</span> <a href="#" data-path="${path}" style="color: inherit; text-decoration: none;">${part}</a>`;
  }
}

function renderFiles(files) {
  const list = document.getElementById('file-list');
  if (!list) return;
  
  updateBreadcrumb();
  
  if (!files || files.length === 0) {
    list.innerHTML = '<li style="text-align: center; padding: 2rem; color: var(--text-light);">No files yet. Upload something!</li>';
    return;
  }
  
  list.innerHTML = files.map(file => `
    <li class="file-item" data-id="${file.id}" data-type="${file.type}" data-name="${file.name}" data-path="${file.path || currentPath}">
      <div class="file-icon">${file.type === 'folder' ? '📁' : '📄'}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-meta">${formatSize(file.size)} - ${formatDate(file.createdAt)}</div>
      </div>
      <button class="file-delete-btn" data-id="${file.id}" data-name="${file.name}" title="Delete">x</button>
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
      list.innerHTML = '<li style="text-align: center; padding: 2rem; color: var(--error);">' + err.message + '</li>';
    }
  }
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

function showContextMenu(e, file) {
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  if (!menu) return;
  
  menu.style.display = 'block';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
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
        const item = document.querySelector(`[data-id="${fileId}"]`);
        const name = item?.dataset.name;
        if (name) {
          currentPath = currentPath === '/' ? '/' + name : currentPath + '/' + name;
          loadFiles();
        }
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
      if (confirm('Are you sure you want to delete "' + fileName + '"?')) {
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
  
  const logoutLink = document.querySelector('[data-action="logout"]');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      auth.logout();
    });
  }
  
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');
  
  if (dropzone) {
    dropzone.addEventListener('click', () => fileInput?.click());
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
  }
  
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => fileInput?.click());
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', handleFiles);
  }
  
  const newFolderBtn = document.getElementById('new-folder-btn');
  const folderInputContainer = document.getElementById('folder-input-container');
  const folderNameInput = document.getElementById('folder-name-input');
  const createFolderBtn = document.getElementById('create-folder-btn');
  const cancelFolderBtn = document.getElementById('cancel-folder-btn');
  
  if (newFolderBtn && folderInputContainer && folderNameInput) {
    newFolderBtn.addEventListener('click', () => {
      folderInputContainer.style.display = 'inline-flex';
      folderNameInput.focus();
    });
    
    createFolderBtn?.addEventListener('click', () => {
      const name = folderNameInput.value.trim();
      if (name) {
        api.createFolder(name, currentPath).then(() => {
          folderNameInput.value = '';
          folderInputContainer.style.display = 'none';
          loadFiles();
        }).catch(err => {
          console.error('Create folder failed:', err);
        });
      }
    });
    
    cancelFolderBtn?.addEventListener('click', () => {
      folderNameInput.value = '';
      folderInputContainer.style.display = 'none';
    });
    
    folderNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        createFolderBtn?.click();
      } else if (e.key === 'Escape') {
        cancelFolderBtn?.click();
      }
    });
  }
  
  document.addEventListener('click', (e) => {
    const breadcrumbLink = e.target.closest('#breadcrumb a');
    if (breadcrumbLink) {
      e.preventDefault();
      const path = breadcrumbLink.dataset.path;
      if (path !== undefined) {
        currentPath = path;
        loadFiles();
      }
    }
  });
  
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.file-delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.id;
      const name = deleteBtn.dataset.name;
      if (confirm('Delete "' + name + '"?')) {
        api.deleteFile(id).then(() => loadFiles()).catch(err => {
          alert('Failed to delete: ' + err.message);
        });
      }
      return;
    }
    
    const fileItem = e.target.closest('.file-item');
    if (fileItem && !e.target.closest('button')) {
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
  
  document.addEventListener('contextmenu', (e) => {
    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      const file = {
        id: fileItem.dataset.id,
        type: fileItem.dataset.type,
        name: fileItem.dataset.name
      };
      showContextMenu(e, file);
    }
  });
  
  const contextMenu = document.getElementById('context-menu');
  if (contextMenu) {
    contextMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.context-menu-item');
      if (item) {
        e.preventDefault();
        const action = item.dataset.action;
        handleContextAction(action, contextMenu.dataset.fileId, contextMenu.dataset.fileType, contextMenu.dataset.fileName);
      }
    });
  }
}
