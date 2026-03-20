// Register Page
import { auth } from '../utils/auth.js';

export function registerPage({ error, success } = {}) {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h1>KeyPear</h1>
        <p style="text-align: center; margin-bottom: 1rem; color: var(--text-light);">Create your account</p>
        
        ${error ? `<div class="error">${error}</div>` : ''}
        ${success ? `<div class="success">${success}</div>` : ''}
        
        <form id="register-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" name="name" required autocomplete="name">
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="6" autocomplete="new-password">
            <small style="color: var(--text-light)">Minimum 6 characters</small>
          </div>
          
          <button type="submit" class="btn">Create Account</button>
        </form>
        
        <div class="auth-footer">
          <p>Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `;
}

export function initRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    
    try {
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      await auth.register(name, email, password);
      
      window.location.href = '/login?registered=true';
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Create Account';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = err.message;
      
      form.insertBefore(errorDiv, form.firstChild);
    }
  });
}
