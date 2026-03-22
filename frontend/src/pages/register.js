// Register Page
import { auth } from '../utils/auth.js';

export function registerPage(props = {}) {
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
                Join the <br/>
                <span class="text-emerald-600">secure vault.</span>
              </h1>
              <p class="text-lg text-slate-500 max-w-md leading-relaxed">
                Create your secure storage account and experience enterprise-grade protection for your personal and business files.
              </p>
            </div>
            <!-- Bento Grid of Security Features -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-6 rounded-xl bg-slate-100 border border-slate-200">
                <span class="material-symbols-outlined text-emerald-600 text-2xl mb-3 block" style="font-variation-settings: 'FILL' 1;">cloud_done</span>
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Automatic Sync</h3>
                <p class="text-xs text-slate-500">Your files sync across all devices instantly.</p>
              </div>
              <div class="p-6 rounded-xl bg-slate-100 border border-slate-200">
                <span class="material-symbols-outlined text-emerald-600 text-2xl mb-3 block" style="font-variation-settings: 'FILL' 1;">share</span>
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Easy Sharing</h3>
                <p class="text-xs text-slate-500">Share files securely with anyone.</p>
              </div>
            </div>
          </div>
          
          <!-- Right Column: Register Card -->
          <div class="lg:col-span-5">
            <div class="bg-white p-8 lg:p-10 rounded-xl shadow-[0_20px_40px_rgba(23,28,34,0.06)] border border-slate-200">
              <div class="mb-8">
                <h2 class="text-3xl font-extrabold tracking-tighter text-slate-900 mb-2">Create Account</h2>
                <p class="text-slate-500 text-sm">Start securing your files today.</p>
              </div>
              
              ${props.error ? `<div class="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">${props.error}</div>` : ''}
              
              <form id="register-form" class="space-y-5">
                <!-- Name Field -->
                <div class="space-y-2">
                  <label for="name" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                  <div class="relative group">
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-emerald-600 transition-colors">badge</span>
                    <input 
                      class="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-emerald-600/20 text-sm placeholder:text-slate-400 outline-none transition-all" 
                      placeholder="Name" 
                      type="text" 
                      id="name" 
                      name="name" 
                      required 
                      autocomplete="name"
                    >
                  </div>
                </div>
                
                <!-- Email Field -->
                <div class="space-y-2">
                  <label for="email" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
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
                
                <!-- Password Field -->
                <div class="space-y-2">
                  <label for="password" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Secure Password</label>
                  <div class="relative group">
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-emerald-600 transition-colors">lock</span>
                    <input 
                      class="w-full pl-12 pr-12 py-4 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-emerald-600/20 text-sm placeholder:text-slate-400 outline-none transition-all" 
                      placeholder="Password" 
                      type="password" 
                      id="password" 
                      name="password" 
                      required 
                      minlength="8"
                      autocomplete="new-password"
                    >
                    <button class="toggle-password absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" type="button">
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </button>
                  </div>
                  <p class="text-[10px] text-slate-400 ml-1">At least 8 characters</p>
                </div>
                
                <!-- Terms -->
                <div class="flex items-start gap-3">
                  <input class="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" id="terms" required>
                  <label for="terms" class="text-xs text-slate-500">I agree to the <a href="#" class="text-emerald-700 font-medium hover:underline">Terms of Service</a> and <a href="#" class="text-emerald-700 font-medium hover:underline">Privacy Policy</a></label>
                </div>
                
                <!-- Actions -->
                <div class="pt-2 flex flex-col gap-4">
                  <button class="w-full bg-[#006b22] text-white font-bold py-4 rounded-lg shadow-md hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2" type="submit" id="register-btn">
                    Create Account
                    <span class="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                  
                  <div class="relative flex items-center py-2">
                    <div class="flex-grow border-t border-slate-200"></div>
                    <span class="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Already have an account?</span>
                    <div class="flex-grow border-t border-slate-200"></div>
                  </div>
                  
                  <a href="/login" class="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-lg hover:bg-slate-200 transition-colors text-sm text-center block">
                    Sign In
                  </a>
                </div>
              </form>
            </div>
            
            <!-- Security Badges -->
            <div class="mt-8 flex justify-center gap-6">
              <div class="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                <span class="material-symbols-outlined text-sm">gpp_good</span>
                <span class="text-[10px] font-bold uppercase tracking-tighter">256-bit Encryption</span>
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
            <a class="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-widest" href="#">Terms</a>
          </nav>
        </div>
      </footer>
      
      <!-- Background Decoration -->
      <div class="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      <div class="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-emerald-800/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
    </div>
  `;
}

export function initRegisterPage() {
  const form = document.getElementById('register-form');
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
    const btn = document.getElementById('register-btn');
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Creating account...';
    
    try {
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      await auth.register(name, email, password);
      
      window.location.href = '/login?registered=true';
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = 'Create Account <span class="material-symbols-outlined text-lg">arrow_forward</span>';
      
      // Show user-friendly error
      let errorMsg = err.message;
      if (err.message.toLowerCase().includes('already') || err.message.includes('409')) {
        errorMsg = 'An account with this email already exists. Try signing in instead.';
      } else if (err.message.includes('400') || err.message.toLowerCase().includes('required')) {
        errorMsg = 'Please fill in all required fields.';
      } else if (err.message.toLowerCase().includes('password')) {
        errorMsg = 'Password must be at least 8 characters.';
      }
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm';
      errorDiv.textContent = errorMsg;
      
      const existingError = form.querySelector('.bg-red-50');
      if (existingError) existingError.remove();
      form.insertBefore(errorDiv, form.firstChild);
    }
  });
}
