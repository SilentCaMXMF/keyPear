// Login Page
import { auth } from '../utils/auth.js';

export function loginPage(props = {}) {
  const urlParams = new URLSearchParams(window.location.search);
  const registered = urlParams.get('registered');
  const success = registered === 'true' ? 'Account created! Please sign in.' : (props.success || '');

  return `
    <div class="auth-container">
      <div class="auth-card">
        <h1>KeyPear</h1>
        <p class="subtitle">Sign in to your account</p>
        
        ${props.error ? `<div class="error">${props.error}</div>` : ''}
        ${success ? `<div class="success">${success}</div>` : ''}
        
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email" placeholder="you@example.com">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Enter your password">
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--space-2);">Sign In</button>
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
      
      const data = await auth.login(email, password);
      
      window.location.href = '/dashboard';
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = err.message;
      
      const existingError = form.querySelector('.error');
      if (existingError) existingError.remove();
      form.insertBefore(errorDiv, form.firstChild);
    }
  });
}
