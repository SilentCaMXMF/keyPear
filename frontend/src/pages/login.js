// Login Page with Debug Logging
import { auth } from '../utils/auth.js';

export function loginPage(props = {}) {
  const urlParams = new URLSearchParams(window.location.search);
  const registered = urlParams.get('registered');
  const success = registered === 'true' ? 'Account created! Please sign in.' : (props.success || '');

  return `
    <div class="auth-container">
      <div class="auth-card">
        <h1>KeyPear</h1>
        <p style="text-align: center; margin-bottom: 1rem; color: var(--text-light);">Sign in to your account</p>
        
        ${props.error ? `<div class="error">${props.error}</div>` : ''}
        ${success ? `<div class="success">${success}</div>` : ''}
        
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="current-password">
          </div>
          
          <button type="submit" class="btn">Sign In</button>
        </form>
        
        <div class="auth-footer">
          <p>Don't have an account? <a href="/register">Create one</a></p>
        </div>
      </div>
    </div>
  `;
}

export function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    
    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      console.log('[Login Debug] Attempting login with:', email);
      
      const data = await auth.login(email, password);
      
      console.log('[Login Debug] Login successful, received data:', {
        token: data.token ? data.token.substring(0, 10) + '...' : null,
        user: data.user
      });
      
      console.log('[Login Debug] Checking localStorage after login:');
      console.log('[Login Debug] keypear_token:', localStorage.getItem('keypear_token') ? 'PRESENT' : 'MISSING');
      console.log('[Login Debug] keypear_user:', localStorage.getItem('keypear_user') ? 'PRESENT' : 'MISSING');
      
      console.log('[Login Debug] Redirecting to /dashboard');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('[Login Debug] Login failed:', err);
      btn.disabled = false;
      btn.textContent = 'Sign In';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = err.message;
      
      form.insertBefore(errorDiv, form.firstChild);
    }
  });
}
