// Simple Router
import { loginPage, initLoginPage } from './pages/login.js';
import { registerPage, initRegisterPage } from './pages/register.js';
import { dashboardPage, initDashboardPage } from './pages/dashboard.js';
import { settingsPage } from './pages/settings.js';

const routes = {
  '/': { render: loginPage, init: initLoginPage },
  '/login': { render: loginPage, init: initLoginPage },
  '/register': { render: registerPage, init: initRegisterPage },
  '/dashboard': { render: dashboardPage, init: initDashboardPage },
  '/settings': { render: settingsPage, init: null },
};

export const router = {
  navigate(pathWithParams, { app, isAuthenticated }) {
    const [path, query] = pathWithParams.split('?');
    const queryString = query ? `?${query}` : '';
    
    if ((path === '/dashboard' || path === '/settings') && !isAuthenticated) {
      window.history.pushState({}, '', '/login');
      const { render, init } = routes['/'];
      app.innerHTML = render({ error: 'Please login first' });
      if (init) init();
      return;
    }

    if ((path === '/login' || path === '/register') && isAuthenticated) {
      window.history.pushState({}, '', '/dashboard');
      app.innerHTML = routes['/dashboard'].render();
      routes['/dashboard'].init?.();
      return;
    }

    const route = routes[path] || routes['/'];
    app.innerHTML = route.render();
    if (route.init) route.init();
    
    window.history.pushState({}, '', path + queryString);
  }
};
