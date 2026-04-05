// Settings Page
import { auth } from '../utils/auth.js';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return bytes.toFixed(1) + ' ' + units[i];
}

export function settingsPage() {
  const user = auth.getUser();

  return `
    <header class="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-3">
      <div class="flex items-center justify-between max-w-full">
        <div class="flex items-center gap-8">
          <span class="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">keyPear</span>
        </div>
        <div class="h-8 w-8 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center">
          <span class="text-sm font-bold text-primary">${user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
        </div>
      </div>
    </header>

    <div class="flex pt-16">
      <aside id="dashboard-sidebar" class="bg-slate-50 dark:bg-slate-950 h-[calc(100vh-4rem)] w-64 fixed left-0 top-16 z-30 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col">
        <div class="px-4 mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="h-10 w-10 rounded-lg bg-primary-container flex items-center justify-center text-white">
              <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">lock</span>
            </div>
            <div>
              <h2 class="text-sm font-bold tracking-tight text-on-surface">${user?.name || 'User'}</h2>
              <p class="text-[10px] text-primary font-medium uppercase tracking-wider">Settings</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 px-2 space-y-1">
          <a href="/dashboard" class="nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all">
            <span class="material-symbols-outlined text-xl">folder</span>
            My Files
          </a>
          <a href="/settings" class="nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-r-2 border-emerald-600">
            <span class="material-symbols-outlined text-xl">settings</span>
            Settings
          </a>
        </nav>

        <div class="p-4 border-t border-slate-200/50 dark:border-slate-800/50 hidden md:block">
          <a href="#" class="nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all" data-action="logout">
            <span class="material-symbols-outlined text-xl">logout</span>
            Sign Out
          </a>
        </div>
      </aside>

      <main id="dashboard-main" class="flex-1 ml-64 p-8">
        <div class="max-w-2xl mx-auto">
          <div class="mb-8">
            <h1 class="text-2xl font-black text-on-surface tracking-tight">Settings</h1>
            <p class="text-on-surface-variant text-sm">Manage your account and preferences.</p>
          </div>

          <div id="settings-error" class="hidden mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"></div>
          <div id="settings-success" class="hidden mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"></div>

          <!-- Profile Section -->
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 mb-6">
            <h2 class="text-lg font-bold text-on-surface mb-4">Profile</h2>
            <form id="profile-form" class="space-y-4">
              <div>
                <label for="name" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Display Name</label>
                <div class="relative group mt-2">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-emerald-600 transition-colors">person</span>
                  <input
                    class="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400 outline-none transition-all"
                    type="text"
                    id="name"
                    name="name"
                    value="${user?.name || ''}"
                    maxlength="100"
                  >
                </div>
              </div>

              <div>
                <label for="wallet-address" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Wallet Address</label>
                <div class="relative group mt-2">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">account_balance_wallet</span>
                  <input
                    class="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg border-none text-sm text-slate-500 outline-none cursor-not-allowed"
                    type="text"
                    id="wallet-address"
                    value="${user?.walletAddress || 'Not connected'}"
                    disabled
                  >
                </div>
                <p class="text-[11px] text-slate-400 mt-1 ml-1">Wallet address cannot be changed</p>
              </div>

              <button type="submit" id="profile-save-btn" class="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 hover:opacity-90 transition-all">
                Save Changes
              </button>
            </form>
          </div>

          <!-- Storage Section -->
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 mb-6">
            <h2 class="text-lg font-bold text-on-surface mb-4">Storage</h2>
            <div id="storage-loading" class="text-sm text-slate-500">Loading storage info...</div>
            <div id="storage-info" class="hidden">
              <div class="flex justify-between text-xs text-on-surface-variant mb-2">
                <span id="storage-used-text">0 B</span>
                <span id="storage-quota-text">10 GB</span>
              </div>
              <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all" id="storage-fill" style="width: 0%"></div>
              </div>
            </div>
          </div>

          <!-- Session Section -->
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
            <h2 class="text-lg font-bold text-on-surface mb-4">Session</h2>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-on-surface">Active Session</p>
                <p class="text-xs text-slate-500">You are currently signed in</p>
              </div>
              <button id="logout-btn" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-on-surface px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <span class="material-symbols-outlined text-lg">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

export function initSettingsPage() {
  const showError = (msg) => {
    const el = document.getElementById('settings-error');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
    const successEl = document.getElementById('settings-success');
    if (successEl) successEl.classList.add('hidden');
  };

  const showSuccess = (msg) => {
    const el = document.getElementById('settings-success');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
    const errorEl = document.getElementById('settings-error');
    if (errorEl) errorEl.classList.add('hidden');
  };

  // Load storage info
  loadStorageInfo();

  // Profile form
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('profile-save-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">sync</span> Saving...';

    try {
      const name = document.getElementById('name').value.trim();
      const user = auth.getUser();

      if (user) {
        user.name = name;
        localStorage.setItem('keypear_user', JSON.stringify(user));
      }

      // Update sidebar user name if it exists
      const sidebarName = document.querySelector('#dashboard-sidebar .text-sm.font-bold');
      if (sidebarName) sidebarName.textContent = name;

      showSuccess('Profile updated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    }

    btn.disabled = false;
    btn.textContent = 'Save Changes';
  });

  // Logout
  document.querySelector('[data-action="logout"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    auth.logout();
  });
}

async function loadStorageInfo() {
  const loadingEl = document.getElementById('storage-loading');
  const infoEl = document.getElementById('storage-info');

  try {
    const token = auth.getToken();
    if (!token) return;

    const response = await fetch(`${API_URL}/api/files`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load storage info');

    const data = await response.json();
    const storage = data.storage;

    if (storage) {
      const used = storage.used || 0;
      const quota = storage.quota || 10 * 1024 * 1024 * 1024;
      const percent = Math.min((used / quota) * 100, 100);

      document.getElementById('storage-used-text').textContent = formatSize(used);
      document.getElementById('storage-quota-text').textContent = formatSize(quota);
      document.getElementById('storage-fill').style.width = percent + '%';

      if (loadingEl) loadingEl.classList.add('hidden');
      if (infoEl) infoEl.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Storage info error:', err);
    if (loadingEl) loadingEl.textContent = 'Failed to load storage info';
  }
}
