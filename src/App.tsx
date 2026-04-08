import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { BottomNav } from '@/components/common/BottomNav';
import { StarryBackground } from '@/components/common/StarryBackground';
import { Toaster } from '@/components/ui/sonner';
import routes from './routes';

const App: React.FC = () => {
  useEffect(() => {
    if (typeof window.plus !== 'undefined') {
      document.addEventListener(
        'plusready',
        () => {
          console.log('HBuilderX environment ready');

          if (window.plus?.android) {
            window.plus.android.addNewIntentHandler((intent: unknown) => {
              console.log('Returned from Xiaohongshu:', intent);
            });
          }
        },
        false,
      );
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <IntersectObserver />
          <div className="relative min-h-screen overflow-x-hidden bg-[#050816] text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.16),_transparent_34%),radial-gradient(circle_at_18%_22%,_rgba(255,255,255,0.08),_transparent_20%),linear-gradient(180deg,_#090b12_0%,_#050816_42%,_#04050b_100%)]" />
            <StarryBackground />
            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[600px] flex-col">
              <main className="flex-grow pb-20">
                <Routes>
                  {routes.map((route, index) => (
                    <Route key={index} path={route.path} element={route.element} />
                  ))}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <BottomNav />
            </div>
          </div>
          <Toaster />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
