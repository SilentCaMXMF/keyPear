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
  
  // Handle navigation via browser back/forward
  window.addEventListener('popstate', (e) => {
    router.navigate(window.location.pathname, { 
      app, 
      isAuthenticated: auth.isLoggedIn() 
    });
  });
  
  // Handle link clicks (SPA navigation)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = new URL(link.href).pathname;
      router.navigate(path, { 
        app, 
        isAuthenticated: auth.isLoggedIn() 
      });
    }
  });
});
