// KeyPear - Main Entry Point
import { router } from './router.js';
import { auth } from './utils/auth.js';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app');
  
  // Check auth state
  const isAuthenticated = auth.isLoggedIn();
  
  // Initial render - include query params
  const pathWithParams = window.location.pathname + (window.location.search || '');
  router.navigate(pathWithParams, { app, isAuthenticated });
  
  // Handle navigation via browser back/forward
  window.addEventListener('popstate', (e) => {
    const path = window.location.pathname + (window.location.search || '');
    router.navigate(path, { 
      app, 
      isAuthenticated: auth.isLoggedIn() 
    });
  });
  
  // Handle link clicks (SPA navigation)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const url = new URL(link.href);
      const pathWithParams = url.pathname + (url.search || '');
      router.navigate(pathWithParams, { 
        app, 
        isAuthenticated: auth.isLoggedIn() 
      });
    }
  });
});
