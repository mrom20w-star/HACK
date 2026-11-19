/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect, useState} from 'react';
import type {AppRoute} from './components/AppHeader';
import {ToastProvider} from './components/ToastProvider';
import {AdminPage} from './pages/AdminPage';
import {CrashPage} from './pages/CrashPage';
import {SplashPage} from './pages/SplashPage';
import {TermsPage} from './pages/TermsPage';

function parseRoute(pathname: string): AppRoute {
  if (pathname === '/terms') return '/terms';
  if (pathname === '/crash') return '/crash';
  if (pathname === '/admin') return '/admin';
  return '/';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseRoute(window.location.pathname) : '/'
  );

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: AppRoute) => {
    if (typeof window !== 'undefined' && window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      window.scrollTo(0, 0);
    }
    setRoute(to);
  }, []);

  return (
    <ToastProvider>
      {route === '/' && <SplashPage onNavigate={navigate} />}
      {route === '/terms' && <TermsPage onNavigate={navigate} />}
      {route === '/crash' && <CrashPage onNavigate={navigate} />}
      {route === '/admin' && <AdminPage onNavigate={navigate} />}
    </ToastProvider>
  );
}
