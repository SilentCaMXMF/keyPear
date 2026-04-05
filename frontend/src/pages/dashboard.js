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

function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  const icons = {
    error: 'error',
    success: 'check_circle',
    warning: 'warning',
    info: 'info',
  };

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg ${colors[type] || colors.error}`;
  toast.innerHTML = `<span class="material-symbols-outlined text-lg">${icons[type] || icons.error}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function dashboardPage() {
  const user = auth.getUser();
  
  return `
    <!-- Top App Bar -->
    <header class="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-3">
      <div class="flex items-center justify-between max-w-full">
        <div class="flex items-center gap-8">
          <span class="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">keyPear</span>
          <div class="hidden md:block relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              type="text" 
              id="search-input"
              class="bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-80 focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
              placeholder="Search files..."
              value="${searchQuery}"
            >
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-8 w-8 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center">
            <span class="text-sm font-bold text-primary">${user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex pt-16">
      <!-- Sidebar -->
      <aside id="dashboard-sidebar" class="bg-slate-50 dark:bg-slate-950 h-[calc(100vh-4rem)] w-64 fixed left-0 top-16 z-30 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col">
        <div class="px-4 mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="h-10 w-10 rounded-lg bg-primary-container flex items-center justify-center text-white">
              <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">lock</span>
            </div>
            <div>
              <h2 class="text-sm font-bold tracking-tight text-on-surface">${user?.name || 'User'}</h2>
              <p class="text-[10px] text-primary font-medium uppercase tracking-wider">Active Session</p>
            </div>
          </div>
          
          <!-- Storage Bar -->
          <div class="bg-white dark:bg-slate-900 rounded-xl p-3 mb-4">
            <div class="flex justify-between text-xs text-on-surface-variant mb-2">
              <span id="storage-used">0 B</span>
              <span id="storage-quota">10 GB</span>
            </div>
            <div class="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all" id="storage-fill" style="width: 0%"></div>
            </div>
          </div>
        </div>
        
        <nav class="flex-1 px-2 space-y-1">
          <a href="#" class="nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${currentView === 'files' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-r-2 border-emerald-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}" data-page="files">
            <span class="material-symbols-outlined text-xl">folder</span>
            My Files
          </a>
          <a href="#" class="nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${currentView === 'shared' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-r-2 border-emerald-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}" data-page="shared">
            <span class="material-symbols-outlined text-xl">group</span>
            Shared with Me
          </a>
          <a href="#" class="nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${currentView === 'recent' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-r-2 border-emerald-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}" data-page="recent">
            <span class="material-symbols-outlined text-xl">schedule</span>
            Recent
          </a>
          <a href="#" class="nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${currentView === 'trash' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-r-2 border-emerald-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}" data-page="trash">
            <span class="material-symbols-outlined text-xl">delete</span>
            Trash
          </a>
        </nav>
        
        <div class="p-4 border-t border-slate-200/50 dark:border-slate-800/50 hidden md:block">
          <a href="#" class="nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all" data-action="logout">
            <span class="material-symbols-outlined text-xl">logout</span>
            Sign Out
          </a>
        </div>
      </aside>

      <!-- Main Content -->
      <main id="dashboard-main" class="flex-1 ml-64 p-8">
        <div class="max-w-6xl mx-auto">
          <!-- Header -->
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div class="flex items-center gap-3 mb-2" id="breadcrumb-container">
                <h1 class="text-2xl font-black text-on-surface tracking-tight" id="breadcrumb-title">My Files</h1>
              </div>
              <p class="text-on-surface-variant text-sm">Securely store and manage your files.</p>
            </div>
            <div class="flex items-center gap-3">
              <div id="files-search" class="${currentView !== 'files' ? 'hidden' : ''}">
                <select id="sort-select" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="created_at:DESC" ${sortBy === 'created_at' && sortOrder === 'DESC' ? 'selected' : ''}>Newest</option>
                  <option value="created_at:ASC" ${sortBy === 'created_at' && sortOrder === 'ASC' ? 'selected' : ''}>Oldest</option>
                  <option value="filename:ASC" ${sortBy === 'filename' && sortOrder === 'ASC' ? 'selected' : ''}>Name A-Z</option>
                  <option value="filename:DESC" ${sortBy === 'filename' && sortOrder === 'DESC' ? 'selected' : ''}>Name Z-A</option>
                  <option value="size:DESC" ${sortBy === 'size' && sortOrder === 'DESC' ? 'selected' : ''}>Size ↓</option>
                  <option value="size:ASC" ${sortBy === 'size' && sortOrder === 'ASC' ? 'selected' : ''}>Size ↑</option>
                </select>
              </div>
              
              <button id="new-folder-btn" class="${currentView !== 'files' ? 'hidden' : ''} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-on-surface px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <span class="material-symbols-outlined text-lg">create_new_folder</span>
                New Folder
              </button>
              
              <button id="upload-btn" class="${currentView !== 'files' ? 'hidden' : ''} bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 hover:opacity-90 transition-all">
                <span class="material-symbols-outlined text-lg">upload</span>
                Upload
              </button>
              
              <button id="empty-trash-btn" class="${currentView !== 'trash' ? 'hidden' : ''} bg-error-container text-on-error-container px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-all">
                Empty Trash
              </button>
            </div>
          </div>

          <!-- Inline folder creation -->
          <div id="folder-input-container" class="hidden mb-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary">create_new_folder</span>
              <input type="text" id="folder-name-input" class="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Folder name">
              <button id="create-folder-btn" class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">Create</button>
              <button id="cancel-folder-btn" class="bg-slate-100 dark:bg-slate-700 text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
            </div>
          </div>

          <!-- Bulk Actions -->
          <div id="bulk-actions" class="hidden mb-4 bg-primary-container/10 border border-primary/20 rounded-xl p-3 flex items-center gap-4">
            <span class="text-sm font-medium text-primary" id="selected-count">0 selected</span>
            <button id="bulk-delete-btn" class="bg-error text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700">Delete</button>
            <button id="bulk-move-btn" class="bg-secondary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-600">Move</button>
            <button id="clear-selection-btn" class="text-on-surface-variant text-xs font-medium hover:text-on-surface">Clear</button>
          </div>

          <!-- Upload Progress -->
          <div id="upload-progress" class="hidden mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div class="flex items-center gap-3 mb-2">
              <span class="material-symbols-outlined text-blue-600 animate-spin">sync</span>
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300" id="progress-text">Uploading... 0%</span>
            </div>
            <div class="h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full transition-all" id="progress-fill" style="width: 0%"></div>
            </div>
          </div>

          <!-- Toast Notification -->
          <div id="toast-container" class="fixed top-20 right-6 z-[80] flex flex-col gap-2 pointer-events-none"></div>

          <!-- Stats Bento Grid (only show in My Files view) -->
          <div id="stats-grid" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 ${currentView !== 'files' ? 'hidden' : ''}">
            <div class="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
              <div class="flex justify-between items-start">
                <span class="material-symbols-outlined text-emerald-600 text-xl">folder</span>
                <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Active</span>
              </div>
              <div>
                <p class="text-xs text-slate-500">All Files</p>
                <p class="text-xl font-bold text-slate-900 dark:text-slate-100" id="stat-total-files">0</p>
              </div>
            </div>
            <div class="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
              <div class="flex justify-between items-start">
                <span class="material-symbols-outlined text-blue-600 text-xl">schedule</span>
              </div>
              <div>
                <p class="text-xs text-slate-500">Recently Added</p>
                <p class="text-xl font-bold text-slate-900 dark:text-slate-100" id="stat-recent-files">0</p>
              </div>
            </div>
            <div class="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
              <div class="flex justify-between items-start">
                <span class="material-symbols-outlined text-purple-600 text-xl">group</span>
              </div>
              <div>
                <p class="text-xs text-slate-500">Shared with Me</p>
                <p class="text-xl font-bold text-slate-900 dark:text-slate-100" id="stat-shared-files">0</p>
              </div>
            </div>
            <div class="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
              <div class="flex justify-between items-start">
                <span class="material-symbols-outlined text-orange-600 text-xl">storage</span>
              </div>
              <div>
                <p class="text-xs text-slate-500">Storage Used</p>
                <p class="text-xl font-bold text-slate-900 dark:text-slate-100" id="stat-storage">0 B</p>
              </div>
            </div>
          </div>

          <!-- File List Container -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
            <!-- Dropzone -->
            <div id="dropzone" class="${currentView !== 'files' ? 'hidden' : ''} p-8 border-b border-slate-100 dark:border-slate-800 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">cloud_upload</span>
              <p class="text-sm text-slate-500">Drag and drop files here or click to upload</p>
              <input type="file" id="file-input" class="hidden" multiple>
            </div>

            <!-- File Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    <th class="px-6 py-4 w-10">
                      <input class="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" id="select-all-checkbox">
                    </th>
                    <th class="px-6 py-4">Name</th>
                    <th class="px-6 py-4">Type</th>
                    <th class="px-6 py-4">Date Added</th>
                    <th class="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="text-sm divide-y divide-slate-100 dark:divide-slate-800" id="file-table-body">
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                      <span class="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">folder_open</span>
                      <p>Loading files...</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- File List (fallback for smaller screens) -->
            <ul class="divide-y divide-slate-100 dark:divide-slate-800 md:hidden" id="file-list-mobile">
            </ul>

            <!-- File List (for list view / fallback) -->
            <ul class="divide-y divide-slate-100 dark:divide-slate-800 hidden" id="file-list">
              <li class="px-6 py-12 text-center text-slate-500">
                <span class="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">folder_open</span>
                <p>Loading files...</p>
              </li>
            </ul>

            <!-- Table Footer -->
            <div class="p-4 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest" id="files-count">Showing 0 of 0 files</p>
              <div class="flex items-center gap-1" id="pagination">
                <button class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 disabled:opacity-30" disabled>
                  <span class="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button class="h-8 w-8 bg-primary text-white text-xs font-bold rounded-lg flex items-center justify-center">1</button>
                <button class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                  <span class="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Context Menu -->
    <div id="context-menu" class="fixed bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 min-w-48 z-[60] hidden">
    </div>

    <!-- Move Modal -->
    <div id="move-modal" class="fixed inset-0 bg-black/50 z-[70] hidden flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-on-surface mb-4">Move to...</h3>
        <div id="folder-tree" class="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 mb-4"></div>
        <div class="flex justify-end gap-3">
          <button id="move-cancel-btn" class="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button id="move-confirm-btn" class="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary/90">Move Here</button>
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
  const titleEl = document.getElementById('breadcrumb-title');
  if (!titleEl) return;
  
  if (!currentFolderId) {
    titleEl.textContent = currentView === 'files' ? 'My Files' : 
                         currentView === 'trash' ? 'Trash' :
                         currentView === 'recent' ? 'Recent Files' :
                         currentView === 'shared' ? 'Shared with Me' : 'My Files';
    return;
  }
  
  titleEl.textContent = currentFolderName || 'Folder';
}

function renderFiles(files, folders, storage) {
  const tableBody = document.getElementById('file-table-body');
  const listMobile = document.getElementById('file-list-mobile');
  const statsGrid = document.getElementById('stats-grid');
  const filesCount = document.getElementById('files-count');
  
  updateBreadcrumb();
  
  const allItems = [
    ...(folders || []).map(f => ({ ...f, type: 'folder' })),
    ...(files || []).map(f => ({ ...f, type: 'file' }))
  ];
  
  // Update stats
  if (statsGrid) {
    document.getElementById('stat-total-files').textContent = (files?.length || 0) + (folders?.length || 0);
    document.getElementById('stat-recent-files').textContent = files?.filter(f => {
      const date = new Date(f.created_at);
      const now = new Date();
      const diff = now - date;
      return diff < 24 * 60 * 60 * 1000; // Last 24 hours
    }).length || 0;
    document.getElementById('stat-storage').textContent = storage ? formatSize(storage.used) : '0 B';
  }
  
  if (filesCount) {
    filesCount.textContent = `Showing ${allItems.length} of ${allItems.length} files`;
  }
  
  if (allItems.length === 0) {
    const emptyHTML = `
      <tr>
        <td colspan="5" class="px-6 py-16 text-center text-slate-500">
          <span class="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">folder_open</span>
          <p>${searchQuery ? 'No files match your search' : 'No files yet. Upload something!'}</p>
          ${currentView === 'files' ? '<p class="text-sm text-slate-400 mt-2">Drag and drop files or click Upload</p>' : ''}
        </td>
      </tr>
    `;
    if (tableBody) tableBody.innerHTML = emptyHTML;
    if (listMobile) listMobile.innerHTML = emptyHTML.replace(/td/g, 'li').replace(/colspan="5"/g, '');
    return;
  }
  
  const renderRow = (item) => {
    const isFolder = item.type === 'folder';
    const thumbnail = item.hasThumbnail ? `<img src="${API_URL}/api/files/${item.id}/thumbnail" class="h-10 w-10 rounded-lg object-cover" alt="" loading="lazy">` : '';
    const icon = isFolder ? 'folder' : (item.icon?.includes('pdf') ? 'picture_as_pdf' : 
                   item.icon?.includes('image') ? 'image' : 
                   item.icon?.includes('video') ? 'videocam' :
                   item.icon?.includes('audio') ? 'audio_file' : 'description');
    const iconBg = isFolder ? 'bg-emerald-50 text-emerald-600' : 
                   item.icon?.includes('pdf') ? 'bg-red-50 text-red-600' :
                   item.icon?.includes('image') ? 'bg-orange-50 text-orange-600' :
                   item.icon?.includes('video') ? 'bg-purple-50 text-purple-600' :
                   item.icon?.includes('audio') ? 'bg-blue-50 text-blue-600' :
                   'bg-slate-100 text-slate-500';
    const displayIcon = thumbnail || `<span class="material-symbols-outlined text-xl ${iconBg}">${icon}</span>`;
    const isSelected = selectedItems.has(item.id);
    const name = item.filename || item.name;
    const type = isFolder ? 'Folder' : (item.mime_type?.split('/')[0] || 'File').charAt(0).toUpperCase() + (item.mime_type?.split('/')[0] || 'file').slice(1);
    
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" data-id="${item.id}" data-type="${item.type}" data-name="${name}">
        <td class="px-6 py-4">
          <input class="file-checkbox rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" ${isSelected ? 'checked' : ''}>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-lg flex items-center justify-center ${iconBg}">
              ${displayIcon}
            </div>
            <div>
              <p class="font-semibold text-slate-900 dark:text-slate-100">${name}</p>
              <p class="text-[11px] text-slate-400 font-mono hidden sm:block">${item.id.slice(0, 8)}...</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-slate-500 font-medium">${type}</td>
        <td class="px-6 py-4 text-slate-500">${item.created_at ? formatDate(item.created_at) : '-'}</td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            ${isFolder ? `
              <button class="open-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500" title="Open">
                <span class="material-symbols-outlined text-lg">folder_open</span>
              </button>
            ` : `
              <button class="download-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500" title="Download">
                <span class="material-symbols-outlined text-lg">download</span>
              </button>
            `}
            <button class="share-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500" title="Share">
              <span class="material-symbols-outlined text-lg">ios_share</span>
            </button>
            <button class="file-delete-btn p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  };
  
  const tableHTML = allItems.map(renderRow).join('');
  if (tableBody) tableBody.innerHTML = tableHTML;
  if (listMobile) listMobile.innerHTML = tableHTML.replace(/<td class="px-6 py-4 text-right">[\s\S]*?<\/td>/g, '').replace(/<th/g, '<td').replace(/<\/th>/g, '</td>');
}

function renderTrashFiles(files, folders) {
  const list = document.getElementById('file-list');
  
  const allItems = [
    ...(folders || []).map(f => ({ ...f, type: 'folder', name: f.name })),
    ...(files || []).map(f => ({ ...f, type: 'file', name: f.filename }))
  ];
  
  if (allItems.length === 0) {
    list.innerHTML = `
      <li class="empty-state px-6 py-16 text-center">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">delete</span>
        <p class="text-on-surface-variant">Trash is empty</p>
      </li>
    `;
    return;
  }
  
  list.innerHTML = allItems.map(item => `
    <li class="file-item flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group" 
        data-id="${item.id}" 
        data-type="${item.type === 'folder' ? 'trash-folder' : 'trash-file'}" 
        data-name="${item.name}">
      <div class="h-10 w-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
        <span class="material-symbols-outlined text-2xl text-red-500">${item.type === 'folder' ? 'folder' : 'description'}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-on-surface truncate">${item.name}</p>
        <p class="text-xs text-on-surface-variant">${item.type === 'folder' ? 'Folder' : formatSize(item.size)} • Deleted ${formatDate(item.deleted_at)}</p>
      </div>
      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button class="restore-btn px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
          Restore
        </button>
        <button class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" data-id="${item.id}" data-type="${item.type === 'folder' ? 'trash-folder' : 'trash-file'}" data-name="${item.name}">
          <span class="material-symbols-outlined text-red-500">delete_forever</span>
        </button>
      </div>
    </li>
  `).join('');
}

function renderRecentFiles(files) {
  const list = document.getElementById('file-list');
  
  if (files.length === 0) {
    list.innerHTML = `
      <li class="empty-state px-6 py-16 text-center">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">schedule</span>
        <p class="text-on-surface-variant">No recent files</p>
      </li>
    `;
    return;
  }
  
  list.innerHTML = files.map(file => {
    const thumbnail = file.hasThumbnail ? `<img src="${API_URL}/api/files/${file.id}/thumbnail" class="h-10 w-10 rounded-lg object-cover" alt="">` : '';
    const icon = file.icon?.includes('pdf') ? 'picture_as_pdf' : 
                 file.icon?.includes('image') ? 'image' : 
                 file.icon?.includes('video') ? 'videocam' :
                 file.icon?.includes('audio') ? 'audio_file' : 'description';
    const displayIcon = thumbnail || `<span class="material-symbols-outlined text-2xl text-slate-400">${icon}</span>`;
    
    return `
      <li class="file-item flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group" 
          data-id="${file.id}" 
          data-type="recent-file" 
          data-name="${file.filename}">
        <div class="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
          ${displayIcon}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-on-surface truncate">${file.filename}</p>
          <p class="text-xs text-on-surface-variant">${formatSize(file.size)} • ${formatDate(file.created_at)}</p>
        </div>
        <button class="file-delete-btn opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" data-id="${file.id}" data-type="recent-file" data-name="${file.filename}">
          <span class="material-symbols-outlined text-red-500">delete</span>
        </button>
      </li>
    `;
  }).join('');
}

function renderSharedFiles(shares) {
  const list = document.getElementById('file-list');
  
  if (shares.length === 0) {
    list.innerHTML = `
      <li class="empty-state px-6 py-16 text-center">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">group</span>
        <p class="text-on-surface-variant">No files shared with you</p>
      </li>
    `;
    return;
  }
  
  list.innerHTML = shares.map(share => {
    const thumbnail = share.hasThumbnail ? `<img src="${API_URL}/api/files/${share.file_id}/thumbnail" class="h-10 w-10 rounded-lg object-cover" alt="">` : '';
    const icon = share.icon?.includes('pdf') ? 'picture_as_pdf' : 
                 share.icon?.includes('image') ? 'image' : 
                 share.icon?.includes('video') ? 'videocam' :
                 share.icon?.includes('audio') ? 'audio_file' : 'description';
    const displayIcon = thumbnail || `<span class="material-symbols-outlined text-2xl text-slate-400">${icon}</span>`;
    
    return `
      <li class="file-item flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group" 
          data-id="${share.file_id}" 
          data-type="shared-file" 
          data-name="${share.filename}"
          data-token="${share.token}">
        <div class="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
          ${displayIcon}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-on-surface truncate">${share.filename}</p>
          <p class="text-xs text-on-surface-variant">${formatSize(share.size)} • Shared by ${share.shared_by_name || 'Unknown'}</p>
        </div>
        <button class="download-btn bg-gradient-to-br from-primary to-primary-container text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all" data-id="${share.file_id}" data-name="${share.filename}">
          <span class="material-symbols-outlined text-base">download</span>
          Download
        </button>
      </li>
    `;
  }).join('');
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
  
  updateBreadcrumb();
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
  renderFiles(filesData.files || [], foldersData.folders || [], filesData.storage);
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
  treeEl.innerHTML = '<div class="text-slate-500 text-sm px-3 py-2">Loading folders...</div>';
  
  try {
    const { folders } = await api.getFolderTree();
    
    const buildTree = (parentId = null, level = 0) => {
      return folders
        .filter(f => f.parent_folder_id === parentId && f.id !== itemId)
        .map(f => `
          <div class="tree-item cursor-pointer px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" data-id="${f.id}" style="padding-left: ${level * 16 + 12}px">
            <span class="material-symbols-outlined text-primary mr-2 align-middle">folder</span>
            <span class="text-sm text-slate-700 dark:text-slate-300">${f.name}</span>
            ${buildTree(f.id, level + 1)}
          </div>
        `).join('');
    };
    
    treeEl.innerHTML = `
      <div class="tree-item cursor-pointer px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors bg-emerald-50 dark:bg-emerald-900/20" data-id="">
        <span class="material-symbols-outlined text-primary mr-2 align-middle">home</span>
        <span class="text-sm font-medium text-primary">My Files (Root)</span>
      </div>
      ${buildTree()}
    `;
    
    treeEl.querySelectorAll('.tree-item').forEach(el => {
      el.addEventListener('click', () => {
        treeEl.querySelectorAll('.tree-item').forEach(i => {
          i.classList.remove('bg-emerald-50', 'dark:bg-emerald-900/20');
          i.classList.remove('bg-slate-100', 'dark:bg-slate-800');
          i.classList.add('hover:bg-slate-100', 'dark:hover:bg-slate-800');
        });
        el.classList.remove('hover:bg-slate-100', 'dark:hover:bg-slate-800');
        el.classList.add('bg-emerald-50', 'dark:bg-emerald-900/20');
        el.dataset.selectedId = el.dataset.id;
      });
    });
    
  } catch (err) {
    treeEl.innerHTML = '<div class="text-red-500 text-sm px-3 py-2">Failed to load folders</div>';
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
    showToast('Failed to move: ' + err.message);
  }
}

function showContextMenu(e, item) {
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  
  let menuItems = '';
  
  if (currentView === 'trash') {
    menuItems = `
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" data-action="restore">
        <span class="material-symbols-outlined text-lg">restore</span> Restore
      </button>
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600" data-action="deletePermanent">
        <span class="material-symbols-outlined text-lg">delete_forever</span> Delete Permanently
      </button>
    `;
  } else if (currentView === 'recent') {
    menuItems = `
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" data-action="download">
        <span class="material-symbols-outlined text-lg">download</span> Download
      </button>
      <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600" data-action="delete">
        <span class="material-symbols-outlined text-lg">delete</span> Delete
      </button>
    `;
  } else if (currentView === 'shared') {
    menuItems = `
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" data-action="download">
        <span class="material-symbols-outlined text-lg">download</span> Download
      </button>
    `;
  } else {
    menuItems = `
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" data-action="open">
        <span class="material-symbols-outlined text-lg">folder_open</span> Open
      </button>
      ${item.type !== 'folder' ? `
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" data-action="download">
        <span class="material-symbols-outlined text-lg">download</span> Download
      </button>` : ''}
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" data-action="copy">
        <span class="material-symbols-outlined text-lg">content_copy</span> Copy
      </button>
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" data-action="rename">
        <span class="material-symbols-outlined text-lg">edit</span> Rename
      </button>
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" data-action="move">
        <span class="material-symbols-outlined text-lg">drive_file_move</span> Move
      </button>
      <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600" data-action="delete">
        <span class="material-symbols-outlined text-lg">delete</span> Delete
      </button>
    `;
  }
  
  menu.innerHTML = menuItems;
  
  menu.style.display = 'block';
  const menuWidth = 200;
  const menuHeight = 300;
  const sidebarWidth = window.innerWidth >= 768 ? 256 : 0;
  const x = Math.min(e.clientX, window.innerWidth - menuWidth);
  const y = Math.min(e.clientY, window.innerHeight - menuHeight);
  menu.style.left = Math.max(sidebarWidth, x) + 'px';
  menu.style.top = Math.max(0, y) + 'px';
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
        showToast('Failed to copy: ' + err.message);
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
          showToast('Failed to rename: ' + err.message);
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
          showToast('Failed to delete: ' + err.message);
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
        showToast('Failed to restore: ' + err.message);
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
          showToast('Failed to delete: ' + err.message);
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
  
  document.querySelectorAll('.nav-link[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
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
        showToast('Failed to create folder: ' + err.message);
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
        showToast('Failed to delete: ' + err.message);
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
      showToast('Select one item to move');
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
    
    // Select all checkbox
    if (e.target.id === 'select-all-checkbox') {
      const checkboxes = document.querySelectorAll('#file-table-body .file-checkbox');
      checkboxes.forEach(cb => {
        const row = cb.closest('tr');
        const id = row?.dataset.id;
        if (e.target.checked) {
          cb.checked = true;
          if (id) selectedItems.add(id);
        } else {
          cb.checked = false;
          if (id) selectedItems.delete(id);
        }
      });
      updateBulkActions();
      return;
    }
    
    const checkbox = e.target.closest('.file-checkbox');
    if (checkbox && checkbox.id !== 'select-all-checkbox') {
      const row = checkbox.closest('tr');
      const id = row?.dataset.id;
      
      if (checkbox.checked) {
        if (id) selectedItems.add(id);
      } else {
        if (id) selectedItems.delete(id);
      }
      updateBulkActions();
      return;
    }
    
    const deleteBtn = e.target.closest('.file-delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const row = deleteBtn.closest('tr');
      const id = row?.dataset.id;
      const type = row?.dataset.type;
      const name = row?.dataset.name;
      if (confirm(`Delete "${name}"?`)) {
        (type === 'folder' || type === 'trash-folder' ? api.deleteFolder(id) : api.deleteFile(id))
          .then(() => loadFiles())
          .catch(err => showToast('Failed: ' + err.message));
      }
      return;
    }
    
    const openBtn = e.target.closest('.open-btn');
    if (openBtn) {
      e.stopPropagation();
      const row = openBtn.closest('tr');
      const id = row?.dataset.id;
      const name = row?.dataset.name;
      currentFolderId = id;
      currentFolderName = name;
      selectedItems.clear();
      loadFiles();
      return;
    }
    
    const fileRow = e.target.closest('tr[data-type="folder"]');
    if (fileRow && !e.target.closest('.file-checkbox') && !e.target.closest('button')) {
      const type = fileRow.dataset.type;
      const name = fileRow.dataset.name;
      const id = fileRow.dataset.id;
      
      if (type === 'folder') {
        currentFolderId = id;
        currentFolderName = name;
        selectedItems.clear();
        loadFiles();
      }
      return;
    }
    
    const downloadBtn = e.target.closest('.download-btn');
    if (downloadBtn) {
      e.stopPropagation();
      const row = downloadBtn.closest('tr');
      const id = row?.dataset.id;
      const name = row?.dataset.name;
      api.downloadFile(id, name);
      return;
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
        .catch(err => showToast('Failed to restore: ' + err.message));
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
      showToast('Trash is already empty');
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
        showToast('Failed to empty trash: ' + err.message);
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
    const item = e.target.closest('[data-action]');
    if (item) {
      e.preventDefault();
      const menu = document.getElementById('context-menu');
      handleContextAction(item.dataset.action, menu.dataset.itemId, menu.dataset.itemType, menu.dataset.itemName);
    }
  });
}
