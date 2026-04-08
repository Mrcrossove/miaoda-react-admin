import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/',
    label: '创作',
    icon: Sparkles,
  },
  {
    path: '/profile',
    label: '我的',
    icon: User,
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const hideNavPaths = ['/login'];

  if (
    hideNavPaths.includes(location.pathname) ||
    location.pathname.startsWith('/agent-chat/')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-[600px] px-4 pb-4">
      <div className="grid h-16 grid-cols-2 overflow-hidden rounded-[24px] border border-gray-200 bg-white/90 shadow-lg backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex h-full flex-col items-center justify-center gap-1 transition-all duration-300',
                isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              {isActive && (
                <div className="absolute inset-x-6 top-2 bottom-2 rounded-2xl bg-gradient-to-r from-violet-100 to-fuchsia-100" />
              )}
              <div
                className={cn(
                  'relative z-10 rounded-full p-2 transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn('relative z-10 text-xs font-medium', isActive && 'text-violet-600')}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}