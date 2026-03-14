// Simple Router
import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { dashboardPage } from './pages/dashboard.js';
import { settingsPage } from './pages/settings.js';

const routes = {
  '/': loginPage,
  '/login': loginPage,
  '/register': registerPage,
  '/dashboard': dashboardPage,
  '/settings': settingsPage,
};

export const router = {
  navigate(path, { app, isAuthenticated }) {
    // Protected routes
    if ((path === '/dashboard' || path === '/settings') && !isAuthenticated) {
      window.history.pushState({}, '', '/login');
      app.innerHTML = routes['/login']({ error: 'Please login first' });
      return;
    }

    // Redirect logged in users away from auth pages
    if ((path === '/login' || path === '/register') && isAuthenticated) {
      window.history.pushState({}, '', '/dashboard');
      app.innerHTML = routes['/dashboard']();
      return;
    }

    const page = routes[path] || routes['/'];
    app.innerHTML = page();
    
    // Update URL
    window.history.pushState({}, '', path);
  }
};
