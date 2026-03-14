// KeyPear - Main Entry Point
import { router } from './router.js';
import { auth } from './utils/auth.js';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app');
  
  // Check auth state
  const isAuthenticated = auth.isLoggedIn();
  
  // Initial render
  router.navigate(window.location.pathname, { app, isAuthenticated });
  
  // Handle navigation
  window.addEventListener('popstate', (e) => {
    router.navigate(window.location.pathname, { 
      app, 
      isAuthenticated: auth.isLoggedIn() 
    });
  });
});
