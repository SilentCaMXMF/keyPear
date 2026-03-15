// Login Page
import { auth } from '../utils/auth.js';

export function loginPage(props = {}) {
  // Check for registered=true in URL
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
    
    <script>
      document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Signing in...';
        
        try {
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          await auth.login(email, password);
          window.location.href = '/dashboard';
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Sign In';
          
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error';
          errorDiv.textContent = err.message;
          
          const form = document.getElementById('login-form');
          form.insertBefore(errorDiv, form.firstChild);
        }
      });
    </script>
  `;
}
