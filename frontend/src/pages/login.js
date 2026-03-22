// Login Page
import { auth } from '../utils/auth.js';

export function loginPage(props = {}) {
  const urlParams = new URLSearchParams(window.location.search);
  const registered = urlParams.get('registered');
  const success = registered === 'true' ? 'Account created! Please sign in.' : (props.success || '');

  return `
    <div class="min-h-screen flex flex-col bg-[#f7f9ff]">
      <!-- Top Navigation Bar -->
      <header class="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl shadow-sm px-6 py-3 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-emerald-600 text-2xl" style="font-variation-settings: 'FILL' 1;">shield</span>
          <span class="text-xl font-black text-black tracking-tighter">keyPear</span>
        </div>
        <div class="flex items-center gap-4">
          <a class="text-sm font-medium text-emerald-700 hover:opacity-80 transition-all" href="#">Support</a>
          <div class="h-4 w-[1px] bg-slate-200"></div>
          <span class="material-symbols-outlined text-slate-500 text-xl">language</span>
        </div>
      </header>
      
      <main class="flex-grow flex items-center justify-center px-4 pt-20 pb-12">
        <div class="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Left Column: Branding & Trust -->
          <div class="hidden lg:flex lg:col-span-7 flex-col gap-8">
            <div class="space-y-4">
              <h1 class="text-[32px] font-extrabold tracking-tighter text-slate-900 leading-tight">
                Securing your <br/>
                <span class="text-emerald-600">digital fortress.</span>
              </h1>
              <p class="text-lg text-slate-500 max-w-md leading-relaxed">
                Experience industrial-grade encryption with keyPear. Your data is housed in an immutable vault, protected by asymmetric security logic.
              </p>
            </div>
            <!-- Bento Grid of Security Features -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-6 rounded-xl bg-slate-100 border border-slate-200">
                <span class="material-symbols-outlined text-emerald-600 text-2xl mb-3 block" style="font-variation-settings: 'FILL' 1;">lock_open</span>
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Zero-Knowledge</h3>
                <p class="text-xs text-slate-500">Your keys never leave your device.</p>
              </div>
              <div class="p-6 rounded-xl bg-slate-100 border border-slate-200">
                <span class="material-symbols-outlined text-emerald-600 text-2xl mb-3 block" style="font-variation-settings: 'FILL' 1;">security</span>
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Audit Ready</h3>
                <p class="text-xs text-slate-500">Full transparency for compliance.</p>
              </div>
            </div>
          </div>
          
          <!-- Right Column: Login Card -->
          <div class="lg:col-span-5">
            <div class="bg-white p-8 lg:p-10 rounded-xl shadow-[0_20px_40px_rgba(23,28,34,0.06)] border border-slate-200">
              <div class="mb-8">
                <h2 class="text-3xl font-extrabold tracking-tighter text-slate-900 mb-2">Sign In</h2>
                <p class="text-slate-500 text-sm">Enter your vault credentials to continue.</p>
              </div>
              
              ${props.error ? `<div class="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">${props.error}</div>` : ''}
              ${success ? `<div class="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">${success}</div>` : ''}
              
              <form id="login-form" class="space-y-6">
                <!-- Identity Field -->
                <div class="space-y-2">
                  <label for="email" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Identity Identifier</label>
                  <div class="relative group">
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-emerald-600 transition-colors">alternate_email</span>
                    <input 
                      class="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-emerald-600/20 text-sm placeholder:text-slate-400 outline-none transition-all" 
                      placeholder="Email" 
                      type="email" 
                      id="email" 
                      name="email" 
                      required 
                      autocomplete="email"
                    >
                  </div>
                </div>
                
                <!-- Passphrase Field -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center ml-1">
                    <label for="password" class="text-xs font-bold uppercase tracking-widest text-slate-500">Secure Passphrase</label>
                    <a class="text-[10px] font-bold text-emerald-700 hover:underline uppercase tracking-tighter" href="#">Forgotten passphrase?</a>
                  </div>
                  <div class="relative group">
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-emerald-600 transition-colors">key</span>
                    <input 
                      class="w-full pl-12 pr-12 py-4 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-emerald-600/20 text-sm placeholder:text-slate-400 outline-none transition-all" 
                      placeholder="Password" 
                      type="password" 
                      id="password" 
                      name="password" 
                      required 
                      autocomplete="current-password"
                    >
                    <button class="toggle-password absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" type="button">
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </button>
                  </div>
                </div>
                
                <!-- MFA Quick Toggle -->
                <div class="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                  <span class="material-symbols-outlined text-emerald-600 mt-0.5" style="font-variation-settings: 'FILL' 1;">verified_user</span>
                  <div class="space-y-1">
                    <p class="text-xs font-bold text-emerald-900">Secure Session</p>
                    <p class="text-[11px] text-slate-500 leading-relaxed">Your session is protected with end-to-end encryption.</p>
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="pt-4 flex flex-col gap-4">
                  <button class="w-full bg-[#006b22] text-white font-bold py-4 rounded-lg shadow-md hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2" type="submit" id="login-btn">
                    Unlock Vault
                    <span class="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                  
                  <div class="relative flex items-center py-2">
                    <div class="flex-grow border-t border-slate-200"></div>
                    <span class="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Deployment?</span>
                    <div class="flex-grow border-t border-slate-200"></div>
                  </div>
                  
                  <a href="/register" class="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-lg hover:bg-slate-200 transition-colors text-sm text-center block">
                    Request Access
                  </a>
                </div>
              </form>
            </div>
            
            <!-- Accessibility/Security Footer -->
            <div class="mt-8 flex justify-center gap-6">
              <div class="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                <span class="material-symbols-outlined text-sm">gpp_good</span>
                <span class="text-[10px] font-bold uppercase tracking-tighter">SOC2 Type II</span>
              </div>
              <div class="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                <span class="material-symbols-outlined text-sm">encrypted</span>
                <span class="text-[10px] font-bold uppercase tracking-tighter">AES-256</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <!-- Global Footer -->
      <footer class="mt-auto py-6 border-t border-slate-100">
        <div class="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-[11px] text-slate-500 font-medium">© 2026 keyPear. All rights reserved.</p>
          <nav class="flex gap-6">
            <a class="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-widest" href="#">Privacy</a>
            <a class="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-widest" href="#">Status</a>
            <a class="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-widest" href="#">Legal</a>
          </nav>
        </div>
      </footer>
      
      <!-- Background Decoration -->
      <div class="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      <div class="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-emerald-800/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
    </div>
  `;
}

export function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;
  
  // Toggle password visibility
  const toggleBtn = form.querySelector('.toggle-password');
  const passwordInput = document.getElementById('password');
  
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.querySelector('span').textContent = isPassword ? 'visibility_off' : 'visibility';
    });
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Signing in...';
    
    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      await auth.login(email, password);
      
      window.location.href = '/dashboard';
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = 'Unlock Vault <span class="material-symbols-outlined text-lg">arrow_forward</span>';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm';
      errorDiv.textContent = err.message;
      
      const existingError = form.querySelector('.bg-red-50');
      if (existingError) existingError.remove();
      form.insertBefore(errorDiv, form.firstChild);
    }
  });
}
