import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserIdFromStorage } from '@/utils/uuid';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/403', '/404', '/'];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);
    const localUserId = getUserIdFromStorage();

    const isAuthenticated = !!localUserId;

    if (!isAuthenticated && !isPublic) {
      console.log('[RouteGuard] 用户未登录，跳转到登录页面');
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}