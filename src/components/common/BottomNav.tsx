import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Sparkles, User, Brain, Image, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/',
    label: '创作',
    icon: Home,
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

  // 不显示底部导航的页面
  const hideNavPaths = ['/login'];
  
  // 智能体对话页面不显示底部导航
  if (
    hideNavPaths.includes(location.pathname) || 
    location.pathname.startsWith('/agent-chat/')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-purple-blue border-t-2 border-gold z-50 shadow-heavy">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 relative',
                isActive 
                  ? 'text-white scale-110' 
                  : 'text-gold/70 hover:text-gold hover:scale-105'
              )}
            >
              {/* 霓虹边框效果（仅当前页）*/}
              {isActive && (
                <div className="absolute inset-0 rounded-lg neon-border-cyan animate-glow" />
              )}
              
              {/* 金属质感图标 */}
              <div className={cn(
                'relative z-10 p-2 rounded-full transition-all duration-300',
                isActive 
                  ? 'bg-gradient-gold shadow-gold' 
                  : 'bg-white/10'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-transform duration-300',
                  isActive && 'animate-bounce-soft'
                )} />
              </div>
              
              {/* 标签文字 */}
              <span className={cn(
                'text-xs font-bold relative z-10',
                isActive && 'text-gradient-rainbow'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
