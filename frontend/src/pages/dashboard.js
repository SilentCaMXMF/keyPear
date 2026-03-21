import { auth } from '../utils/auth.js';
import { api } from '../utils/api.js';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';
let currentFolderId = null;
let currentFolderName = null;
let folderPath = [];
let currentView = 'files';
let searchQuery = '';
let sortBy = 'created_at';
let sortOrder = 'DESC';
let selectedItems = new Set();
let uploadProgress = null;
let pendingMoveItem = null;

export function dashboardPage() {
  const user = auth.getUser();
  
  return `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>KeyPear</h2>
          <p class="label-small">${user?.name || 'User'}</p>
        </div>
        
        <div class="storage-bar">
          <div class="storage-info">
            <span id="storage-used">0 B</span> / <span id="storage-quota">10 GB</span>
          </div>
          <div class="storage-progress">
            <div class="storage-fill" id="storage-fill" style="width: 0%"></div>
          </div>
        </div>
        
        <nav>
          <a href="#" class="nav-item active" data-page="files">
            <span>📁</span> My Files
          </a>
          <a href="#" class="nav-item" data-page="shared">
            <span>🔗</span> Shared with me
          </a>
          <a href="#" class="nav-item" data-page="recent">
            <span>🕐</span> Recent
          </a>
          <a href="#" class="nav-item" data-page="trash">
            <span>🗑️</span> Trash
          </a>
        </nav>
        
        <div>
          <a href="#" class="nav-item" data-action="logout">
            <span>🚪</span> Sign Out
          </a>
        </div>
      </aside>
      
      <main class="main-content">
        <div class="file-browser">
          <div class="toolbar">
            <div class="toolbar-left" id="files-toolbar">
              <button class="btn btn-primary" id="upload-btn">
                <span>+</span> Upload
              </button>
              <button class="btn btn-secondary" id="new-folder-btn">
                <span>📂</span> New Folder
              </button>
              
              <div id="folder-input-container" class="inline-input" style="display: none;">
                <input type="text" id="folder-name-input" placeholder="Folder name">
                <button class="btn btn-primary btn-sm" id="create-folder-btn">Create</button>
                <button class="btn btn-tertiary btn-sm" id="cancel-folder-btn">Cancel</button>
              </div>
            </div>
            
            <div class="toolbar-left" id="trash-toolbar" style="display: none;">
              <button class="btn btn-sm btn-tertiary" id="empty-trash-btn" disabled>Empty Trash</button>
            </div>
            
            <div class="toolbar-right" id="files-search">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" id="search-input" placeholder="Search files..." value="${searchQuery}">
              </div>
              
              <select id="sort-select" class="sort-select">
                <option value="created_at:DESC" ${sortBy === 'created_at' && sortOrder === 'DESC' ? 'selected' : ''}>Newest</option>
                <option value="created_at:ASC" ${sortBy === 'created_at' && sortOrder === 'ASC' ? 'selected' : ''}>Oldest</option>
                <option value="filename:ASC" ${sortBy === 'filename' && sortOrder === 'ASC' ? 'selected' : ''}>Name A-Z</option>
                <option value="filename:DESC" ${sortBy === 'filename' && sortOrder === 'DESC' ? 'selected' : ''}>Name Z-A</option>
                <option value="size:DESC" ${sortBy === 'size' && sortOrder === 'DESC' ? 'selected' : ''}>Size ↓</option>
                <option value="size:ASC" ${sortBy === 'size' && sortOrder === 'ASC' ? 'selected' : ''}>Size ↑</option>
              </select>
            </div>
          </div>
          
          <div id="breadcrumb-container" class="breadcrumb-container">
            <span id="breadcrumb">My Files</span>
          </div>
          
          <div id="bulk-actions" class="bulk-actions" style="display: none;">
            <span id="selected-count">0 selected</span>
            <button class="btn btn-sm btn-error" id="bulk-delete-btn">Delete Selected</button>
            <button class="btn btn-sm btn-secondary" id="bulk-move-btn">Move</button>
            <button class="btn btn-sm btn-tertiary" id="clear-selection-btn">Clear</button>
          </div>
          
          <div id="upload-progress" class="upload-progress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <span id="progress-text">Uploading... 0%</span>
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
      
      <div id="context-menu" class="context-menu" style="display: none;"></div>
      
      <div id="move-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <h3>Move to...</h3>
          <div id="folder-tree" class="folder-tree"></div>
          <div class="modal-actions">
            <button class="btn btn-tertiary" id="move-cancel-btn">Cancel</button>
            <button class="btn btn-primary" id="move-confirm-btn">Move Here</button>
          </div>
        </div>
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

function updateStorageDisplay(storage) {
  if (!storage) return;
  const used = storage.used || 0;
  const quota = storage.quota || 10 * 1024 * 1024 * 1024;
  const percent = Math.min((used / quota) * 100, 100);
  
  document.getElementById('storage-used').textContent = formatSize(used);
  document.getElementById('storage-quota').textContent = formatSize(quota);
  document.getElementById('storage-fill').style.width = percent + '%';
}

function updateBreadcrumb() {
  const breadcrumb = document.getElementById('breadcrumb');
  const container = document.getElementById('breadcrumb-container');
  if (!breadcrumb || !container) return;
  
  if (!currentFolderId) {
    container.style.display = 'block';
    breadcrumb.textContent = 'My Files';
    return;
  }
  
  container.style.display = 'block';
  breadcrumb.innerHTML = `
    <a href="#" data-folder-id="" style="color: inherit;">My Files</a>
    <span style="margin: 0 0.5rem; color: var(--outline);">/</span>
    <span style="color: var(--on-surface);">${currentFolderName || 'Folder'}</span>
  `;
}

function renderFiles(files, folders) {
  const list = document.getElementById('file-list');
  if (!list) return;
  
  updateBreadcrumb();
  
  const allItems = [
    ...(folders || []).map(f => ({ ...f, type: 'folder' })),
    ...(files || []).map(f => ({ ...f, type: 'file' }))
  ];
  
  if (allItems.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">📭</div>
        <p>${searchQuery ? 'No files match your search' : 'No files yet. Upload something!'}</p>
      </li>
    `;
    return;
  }
  
  list.innerHTML = allItems.map(item => {
    const isFolder = item.type === 'folder';
    const icon = item.icon || (isFolder ? '📁' : '📄');
    const thumbnail = item.hasThumbnail ? `<img src="${API_URL}/api/files/${item.id}/thumbnail" class="file-thumbnail" alt="" loading="lazy">` : '';
    const displayIcon = thumbnail || `<span class="file-icon">${icon}</span>`;
    const isSelected = selectedItems.has(item.id);
    
    return `
      <li class="file-item ${isSelected ? 'selected' : ''}" 
          data-id="${item.id}" 
          data-type="${item.type}" 
          data-name="${item.filename || item.name}"
          data-parent="${item.folder_id || item.parent_folder_id || ''}">
        <input type="checkbox" class="file-checkbox" ${isSelected ? 'checked' : ''}>
        <div class="file-preview">${displayIcon}</div>
        <div class="file-info">
          <div class="file-name">${item.filename || item.name}</div>
          <div class="file-meta">${formatSize(item.size)}${item.created_at ? ' • ' + formatDate(item.created_at) : ''}</div>
        </div>
        <button class="file-delete-btn" data-id="${item.id}" data-type="${item.type}" data-name="${item.filename || item.name}" title="Delete">×</button>
      </li>
    `;
  }).join('');
}

function renderTrashFiles(files, folders) {
  const list = document.getElementById('file-list');
  
  const allItems = [
    ...(folders || []).map(f => ({ ...f, type: 'folder', name: f.name })),
    ...(files || []).map(f => ({ ...f, type: 'file', name: f.filename }))
  ];
  
  if (allItems.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">🗑️</div>
        <p>Trash is empty</p>
      </li>
    `;
    return;
  }
  
  list.innerHTML = allItems.map(item => `
    <li class="file-item" 
        data-id="${item.id}" 
        data-type="${item.type === 'folder' ? 'trash-folder' : 'trash-file'}" 
        data-name="${item.name}">
      <input type="checkbox" class="file-checkbox">
      <div class="file-preview">
        ${item.type === 'folder' 
          ? '<span class="file-icon">📁</span>'
          : (item.thumbnail_path 
            ? `<img src="${API_URL}/api/files/${item.id}/thumbnail" class="file-thumbnail" alt="">`
            : `<span class="file-icon">${item.icon || '📄'}</span>`)
        }
      </div>
      <div class="file-info">
        <div class="file-name">${item.name}</div>
        <div class="file-meta">${item.type === 'folder' ? 'Folder' : formatSize(item.size)} • Deleted ${formatDate(item.deleted_at)}</div>
      </div>
      <div class="file-actions">
        <button class="restore-btn" data-id="${item.id}" data-type="${item.type}">↩️ Restore</button>
        <button class="file-delete-btn danger" data-id="${item.id}" data-type="${item.type === 'folder' ? 'trash-folder' : 'trash-file'}" data-name="${item.name}" title="Delete permanently">×</button>
      </div>
    </li>
  `).join('');
}

function renderRecentFiles(files) {
  const list = document.getElementById('file-list');
  
  if (files.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">🕐</div>
        <p>No recent files</p>
      </li>
    `;
    return;
  }
  
  list.innerHTML = files.map(file => `
    <li class="file-item" 
        data-id="${file.id}" 
        data-type="recent-file" 
        data-name="${file.filename}">
      <input type="checkbox" class="file-checkbox">
      <div class="file-preview">
        ${file.thumbnail_path 
          ? `<img src="${API_URL}/api/files/${file.id}/thumbnail" class="file-thumbnail" alt="">`
          : `<span class="file-icon">${file.icon || '📄'}</span>`
        }
      </div>
      <div class="file-info">
        <div class="file-name">${file.filename}</div>
        <div class="file-meta">${formatSize(file.size)} • ${formatDate(file.created_at)}</div>
      </div>
      <button class="file-delete-btn" data-id="${file.id}" data-type="recent-file" data-name="${file.filename}" title="Delete">×</button>
    </li>
  `).join('');
}

function renderSharedFiles(shares) {
  const list = document.getElementById('file-list');
  
  if (shares.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">🔗</div>
        <p>No files shared with you</p>
      </li>
    `;
    return;
  }
  
  list.innerHTML = shares.map(share => `
    <li class="file-item shared-item" 
        data-id="${share.file_id}" 
        data-type="shared-file" 
        data-name="${share.filename}"
        data-token="${share.token}">
      <input type="checkbox" class="file-checkbox">
      <div class="file-preview">
        ${share.thumbnail_path 
          ? `<img src="${API_URL}/api/files/${share.file_id}/thumbnail" class="file-thumbnail" alt="">`
          : `<span class="file-icon">📄</span>`
        }
      </div>
      <div class="file-info">
        <div class="file-name">${share.filename}</div>
        <div class="file-meta">${formatSize(share.size)} • Shared by ${share.shared_by_name || 'Unknown'}</div>
      </div>
      <div class="file-actions">
        <button class="btn btn-sm btn-primary download-btn" data-id="${share.file_id}" data-name="${share.filename}" title="Download">⬇️ Download</button>
      </div>
    </li>
  `).join('');
}

function updateBulkActions() {
  const bulkActions = document.getElementById('bulk-actions');
  const countEl = document.getElementById('selected-count');
  
  if (selectedItems.size > 0) {
    bulkActions.style.display = 'flex';
    countEl.textContent = `${selectedItems.size} selected`;
  } else {
    bulkActions.style.display = 'none';
  }
}

function switchView(view) {
  currentView = view;
  currentFolderId = null;
  currentFolderName = null;
  selectedItems.clear();
  updateBulkActions();
  
  const filesToolbar = document.getElementById('files-toolbar');
  const trashToolbar = document.getElementById('trash-toolbar');
  const filesSearch = document.getElementById('files-search');
  const breadcrumbContainer = document.getElementById('breadcrumb-container');
  const dropzone = document.getElementById('dropzone');
  
  filesToolbar.style.display = view === 'files' ? 'flex' : 'none';
  trashToolbar.style.display = view === 'trash' ? 'flex' : 'none';
  filesSearch.style.display = (view === 'files' || view === 'shared') ? 'flex' : 'none';
  breadcrumbContainer.style.display = view === 'files' ? 'block' : 'none';
  dropzone.style.display = view === 'files' ? 'block' : 'none';
  
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) {
    switch (view) {
      case 'trash':
        breadcrumb.textContent = 'Trash';
        break;
      case 'recent':
        breadcrumb.textContent = 'Recent Files';
        break;
      case 'shared':
        breadcrumb.textContent = 'Shared with Me';
        break;
      default:
        breadcrumb.textContent = 'My Files';
    }
  }
  
  loadFiles();
}

async function loadFiles() {
  const list = document.getElementById('file-list');
  list.innerHTML = `
    <li style="text-align: center; padding: var(--space-8); color: var(--on-surface-variant);">
      Loading...
    </li>
  `;
  
  try {
    switch (currentView) {
      case 'trash':
        await loadTrash();
        break;
      case 'recent':
        await loadRecent();
        break;
      case 'shared':
        await loadShared();
        break;
      default:
        await loadNormalFiles();
    }
  } catch (err) {
    console.error('Load files error:', err);
    list.innerHTML = `
      <li style="text-align: center; padding: var(--space-8); color: var(--error);">
        ${err.message}
      </li>
    `;
  }
}

async function loadNormalFiles() {
  const [filesData, foldersData] = await Promise.all([
    api.getFiles(currentFolderId, { search: searchQuery, sort: sortBy, order: sortOrder }),
    api.getFolders(currentFolderId, searchQuery)
  ]);
  
  if (currentFolderId && foldersData.folders) {
    const currentFolder = foldersData.folders.find(f => f.id === currentFolderId);
    if (!currentFolder) {
      const allFolders = await api.getFolderTree().catch(() => ({ folders: [] }));
      const folder = allFolders.folders?.find(f => f.id === currentFolderId);
      if (folder) {
        currentFolderName = folder.name;
      }
    } else {
      currentFolderName = currentFolder.name;
    }
  } else if (!currentFolderId) {
    currentFolderName = null;
  }
  
  updateStorageDisplay(filesData.storage);
  updateBreadcrumb();
  renderFiles(filesData.files || [], foldersData.folders || []);
}

async function loadTrash() {
  const [{ files = [] }, { folders = [] }] = await Promise.all([
    api.getTrash().catch(() => ({ files: [] })),
    api.getTrashFolders().catch(() => ({ folders: [] }))
  ]);
  renderTrashFiles(files, folders);
}

async function loadRecent() {
  const { files } = await api.getRecentFiles();
  renderRecentFiles(files || []);
}

async function loadShared() {
  const { shares } = await api.getSharedWithMe();
  renderSharedFiles(shares || []);
}

async function handleFiles(e) {
  const fileList = Array.from(e.target.files);
  if (fileList.length === 0) return;
  
  const progressEl = document.getElementById('upload-progress');
  const fillEl = document.getElementById('progress-fill');
  const textEl = document.getElementById('progress-text');
  
  progressEl.style.display = 'block';
  
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    try {
      await api.uploadFile(file, currentFolderId, (percent) => {
        fillEl.style.width = percent + '%';
        textEl.textContent = `Uploading ${file.name}... ${percent}%`;
      });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }
  
  progressEl.style.display = 'none';
  fillEl.style.width = '0%';
  loadFiles();
}

async function showMoveModal(itemId, itemType) {
  const modal = document.getElementById('move-modal');
  const treeEl = document.getElementById('folder-tree');
  
  pendingMoveItem = { id: itemId, type: itemType };
  
  modal.style.display = 'flex';
  treeEl.innerHTML = '<div class="loading">Loading folders...</div>';
  
  try {
    const { folders } = await api.getFolderTree();
    
    const buildTree = (parentId = null, level = 0) => {
      return folders
        .filter(f => f.parent_folder_id === parentId && f.id !== itemId)
        .map(f => `
          <div class="tree-item" data-id="${f.id}" style="padding-left: ${level * 20}px">
            <span class="tree-icon">📁</span> ${f.name}
            ${buildTree(f.id, level + 1)}
          </div>
        `).join('');
    };
    
    treeEl.innerHTML = `
      <div class="tree-item root" data-id="">
        <span class="tree-icon">🏠</span> My Files (Root)
      </div>
      ${buildTree()}
    `;
    
    treeEl.querySelectorAll('.tree-item').forEach(el => {
      el.addEventListener('click', () => {
        treeEl.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        el.dataset.selectedId = el.dataset.id;
      });
    });
    
  } catch (err) {
    treeEl.innerHTML = '<div class="error">Failed to load folders</div>';
  }
}

function hideMoveModal() {
  document.getElementById('move-modal').style.display = 'none';
  pendingMoveItem = null;
}

async function handleMoveConfirm(itemId, itemType) {
  const treeEl = document.getElementById('folder-tree');
  const selectedEl = treeEl.querySelector('.tree-item.selected');
  const targetFolderId = selectedEl?.dataset.id || null;
  
  try {
    if (itemType === 'folder') {
      await api.updateFolder(itemId, { parentFolderId: targetFolderId });
    } else {
      await api.updateFile(itemId, { folderId: targetFolderId });
    }
    hideMoveModal();
    loadFiles();
  } catch (err) {
    alert('Failed to move: ' + err.message);
  }
}

function showContextMenu(e, item) {
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  
  let menuItems = '';
  
  if (currentView === 'trash') {
    menuItems = `
      <div class="context-menu-item" data-action="restore">↩️ Restore</div>
      <div class="context-menu-item danger" data-action="deletePermanent">🗑️ Delete Permanently</div>
    `;
  } else if (currentView === 'recent') {
    menuItems = `
      <div class="context-menu-item" data-action="download">⬇️ Download</div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item danger" data-action="delete">🗑️ Delete</div>
    `;
  } else if (currentView === 'shared') {
    menuItems = `
      <div class="context-menu-item" data-action="download">⬇️ Download</div>
    `;
  } else {
    menuItems = `
      <div class="context-menu-item" data-action="open">📂 Open</div>
      ${item.type !== 'folder' ? '<div class="context-menu-item" data-action="download">⬇️ Download</div>' : ''}
      <div class="context-menu-item" data-action="copy">📋 Copy</div>
      <div class="context-menu-item" data-action="rename">✏️ Rename</div>
      <div class="context-menu-item" data-action="move">📦 Move</div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item danger" data-action="delete">🗑️ Delete</div>
    `;
  }
  
  menu.innerHTML = menuItems;
  
  menu.style.display = 'block';
  menu.style.left = Math.min(e.pageX, window.innerWidth - 180) + 'px';
  menu.style.top = Math.min(e.pageY, window.innerHeight - 200) + 'px';
  menu.dataset.itemId = item.id;
  menu.dataset.itemType = item.type;
  menu.dataset.itemName = item.name;
  if (item.token) {
    menu.dataset.itemToken = item.token;
  }
}

function hideContextMenu() {
  document.getElementById('context-menu').style.display = 'none';
}

async function handleContextAction(action, itemId, itemType, itemName) {
  hideContextMenu();
  
  switch (action) {
    case 'open':
      if (itemType === 'folder') {
        currentFolderId = itemId;
        selectedItems.clear();
        loadFiles();
      }
      break;
      
    case 'download':
      api.downloadFile(itemId, itemName);
      break;
      
    case 'copy':
      try {
        if (itemType === 'folder') {
          await api.copyFolder(itemId, currentFolderId);
        } else {
          await api.copyFile(itemId, currentFolderId);
        }
        loadFiles();
      } catch (err) {
        alert('Failed to copy: ' + err.message);
      }
      break;
      
    case 'rename':
      const newName = prompt('Enter new name:', itemName);
      if (newName && newName !== itemName) {
        try {
          if (itemType === 'folder') {
            await api.updateFolder(itemId, { name: newName });
          } else {
            await api.updateFile(itemId, { name: newName });
          }
          loadFiles();
        } catch (err) {
          alert('Failed to rename: ' + err.message);
        }
      }
      break;
      
    case 'move':
      showMoveModal(itemId, itemType);
      break;
      
      case 'delete':
      if (confirm(`Delete "${itemName}"?`)) {
        try {
          if (itemType === 'folder') {
            await api.deleteFolder(itemId);
          } else {
            await api.deleteFile(itemId);
          }
          selectedItems.delete(itemId);
          loadFiles();
        } catch (err) {
          alert('Failed to delete: ' + err.message);
        }
      }
      break;
      
    case 'restore':
      try {
        if (itemType === 'folder' || itemType === 'trash-folder') {
          await api.restoreFolder(itemId);
        } else {
          await fetch(`${API_URL}/api/files/${itemId}/restore`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
          });
        }
        loadFiles();
      } catch (err) {
        alert('Failed to restore: ' + err.message);
      }
      break;
      
    case 'deletePermanent':
      if (confirm(`Permanently delete "${itemName}"? This cannot be undone.`)) {
        try {
          if (itemType === 'folder' || itemType === 'trash-folder') {
            await api.deleteFolder(itemId, true);
          } else {
            await fetch(`${API_URL}/api/files/${itemId}?permanent=true`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${auth.getToken()}` }
            });
          }
          loadFiles();
        } catch (err) {
          alert('Failed to delete: ' + err.message);
        }
      }
      break;
  }
}

export function initDashboardPage() {
  currentFolderId = null;
  searchQuery = '';
  selectedItems.clear();
  loadFiles();
  
  document.addEventListener('click', hideContextMenu);
  
  document.querySelector('[data-action="logout"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });
  
  document.getElementById('breadcrumb')?.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      e.preventDefault();
      currentFolderId = null;
      currentFolderName = null;
      selectedItems.clear();
      loadFiles();
    }
  });
  
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      const page = item.dataset.page;
      switchView(page);
    });
  });
  
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      loadFiles();
    }, 300);
  });
  
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    const [sort, order] = e.target.value.split(':');
    sortBy = sort;
    sortOrder = order;
    loadFiles();
  });
  
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
  
  document.getElementById('new-folder-btn')?.addEventListener('click', () => {
    document.getElementById('folder-input-container').style.display = 'inline-flex';
    document.getElementById('folder-name-input')?.focus();
  });
  
  document.getElementById('create-folder-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('folder-name-input')?.value.trim();
    if (name) {
      try {
        await api.createFolder(name, currentFolderId);
        document.getElementById('folder-name-input').value = '';
        document.getElementById('folder-input-container').style.display = 'none';
        loadFiles();
      } catch (err) {
        alert('Failed to create folder: ' + err.message);
      }
    }
  });
  
  document.getElementById('cancel-folder-btn')?.addEventListener('click', () => {
    document.getElementById('folder-name-input').value = '';
    document.getElementById('folder-input-container').style.display = 'none';
  });
  
  document.getElementById('bulk-delete-btn')?.addEventListener('click', async () => {
    if (confirm(`Delete ${selectedItems.size} items?`)) {
      try {
        await api.bulkDelete(Array.from(selectedItems));
        selectedItems.clear();
        updateBulkActions();
        loadFiles();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  });
  
  document.getElementById('bulk-move-btn')?.addEventListener('click', () => {
    if (selectedItems.size === 1) {
      const itemId = Array.from(selectedItems)[0];
      const itemEl = document.querySelector(`.file-item[data-id="${itemId}"]`);
      const itemType = itemEl?.dataset.type || 'file';
      showMoveModal(itemId, itemType);
    } else {
      alert('Select one item to move');
    }
  });
  
  document.getElementById('clear-selection-btn')?.addEventListener('click', () => {
    selectedItems.clear();
    document.querySelectorAll('.file-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('selected'));
    updateBulkActions();
  });
  
  document.getElementById('move-cancel-btn')?.addEventListener('click', hideMoveModal);
  document.getElementById('move-confirm-btn')?.addEventListener('click', () => {
    if (pendingMoveItem) {
      handleMoveConfirm(pendingMoveItem.id, pendingMoveItem.type);
      pendingMoveItem = null;
    }
  });
  
  document.addEventListener('click', (e) => {
    const link = e.target.closest('#breadcrumb a');
    if (link) {
      e.preventDefault();
      currentFolderId = null;
      currentFolderName = null;
      selectedItems.clear();
      loadFiles();
      return;
    }
    
    const checkbox = e.target.closest('.file-checkbox');
    if (checkbox) {
      const item = checkbox.closest('.file-item');
      const id = item.dataset.id;
      
      if (checkbox.checked) {
        selectedItems.add(id);
        item.classList.add('selected');
      } else {
        selectedItems.delete(id);
        item.classList.remove('selected');
      }
      updateBulkActions();
      return;
    }
    
    const deleteBtn = e.target.closest('.file-delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.id;
      const type = deleteBtn.dataset.type;
      const name = deleteBtn.dataset.name;
      if (confirm(`Delete "${name}"?`)) {
        (type === 'folder' || type === 'trash-folder' ? api.deleteFolder(id) : api.deleteFile(id))
          .then(() => loadFiles())
          .catch(err => alert('Failed: ' + err.message));
      }
      return;
    }
    
    const fileItem = e.target.closest('.file-item');
    if (fileItem && !e.target.closest('.file-checkbox') && !e.target.closest('.file-actions')) {
      const type = fileItem.dataset.type;
      const name = fileItem.dataset.name;
      const id = fileItem.dataset.id;
      
      if (type === 'folder') {
        currentFolderId = id;
        currentFolderName = name;
        selectedItems.clear();
        loadFiles();
      } else if (type !== 'trash-file' && type !== 'trash-folder' && type !== 'shared-file') {
        api.downloadFile(id, name);
      }
    }
    
    const restoreBtn = e.target.closest('.restore-btn');
    if (restoreBtn) {
      e.stopPropagation();
      const id = restoreBtn.dataset.id;
      const type = restoreBtn.dataset.type;
      const restoreApi = type === 'folder' ? api.restoreFolder(id) : 
        fetch(`${API_URL}/api/files/${id}/restore`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
      Promise.resolve(restoreApi)
        .then(() => loadFiles())
        .catch(err => alert('Failed to restore: ' + err.message));
      return;
    }
    
    const downloadBtn = e.target.closest('.download-btn');
    if (downloadBtn) {
      e.stopPropagation();
      const id = downloadBtn.dataset.id;
      const name = downloadBtn.dataset.name;
      api.downloadFile(id, name);
      return;
    }
  });
  
  document.getElementById('empty-trash-btn')?.addEventListener('click', async () => {
    const [{ files = [] }, { folders = [] }] = await Promise.all([
      api.getTrash().catch(() => ({ files: [] })),
      api.getTrashFolders().catch(() => ({ folders: [] }))
    ]);
    
    const total = files.length + folders.length;
    if (total === 0) {
      alert('Trash is already empty');
      return;
    }
    if (confirm(`Permanently delete ${total} item(s)? This cannot be undone.`)) {
      try {
        for (const file of files) {
          await fetch(`${API_URL}/api/files/${file.id}?permanent=true`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
          });
        }
        for (const folder of folders) {
          await api.deleteFolder(folder.id, true);
        }
        loadFiles();
      } catch (err) {
        alert('Failed to empty trash: ' + err.message);
      }
    }
  });
  
  document.addEventListener('contextmenu', (e) => {
    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      showContextMenu(e, {
        id: fileItem.dataset.id,
        type: fileItem.dataset.type,
        name: fileItem.dataset.name,
        token: fileItem.dataset.token
      });
    }
  });
  
  document.getElementById('context-menu')?.addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item');
    if (item) {
      e.preventDefault();
      const menu = document.getElementById('context-menu');
      handleContextAction(item.dataset.action, menu.dataset.itemId, menu.dataset.itemType, menu.dataset.itemName);
    }
  });
}
