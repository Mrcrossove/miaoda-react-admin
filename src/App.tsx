import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { BottomNav } from '@/components/common/BottomNav';
import { Toaster } from '@/components/ui/sonner';
import routes from './routes';

const App: React.FC = () => {
  useEffect(() => {
    // HBuilderX 5+ App环境：处理小红书回调返回
    if (typeof window.plus !== 'undefined') {
      // 监听被小红书唤起返回
      document.addEventListener('plusready', () => {
        console.log('HBuilderX环境准备就绪');
        
        // 处理Android的NewIntent（从小红书返回）
        if (window.plus?.android) {
          window.plus.android.addNewIntentHandler((intent: unknown) => {
            console.log('从小红书返回:', intent);
            // 可在此处刷新页面状态或提示发布成功
            // 例如：显示"发布成功"提示，刷新我的产品列表等
          });
        }
      }, false);
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <IntersectObserver />
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
          <Toaster />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
