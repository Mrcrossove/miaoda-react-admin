import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Lock, Sparkles } from 'lucide-react';
import { loginWithAccount } from '@/db/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('请输入账号和密码');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithAccount(username, password);
      
      if (result.success) {
        // 保存用户信息到localStorage
        localStorage.setItem('user_info', JSON.stringify({
          userId: result.userId,
          username: result.username,
          displayName: result.displayName
        }));
        
        toast.success('登录成功');
        navigate(from, { replace: true });
      } else {
        toast.error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录异常:', error);
      toast.error('登录异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              自媒体创作
            </CardTitle>
            <CardDescription className="text-base mt-2 font-bold">
              使用账号密码登录
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4" />
                账号
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                className="h-12 text-base"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold flex items-center gap-2">
                <Lock className="w-4 h-4" />
                密码
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="h-12 text-base"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-black bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 font-bold">
              💡 温馨提示
            </p>
            <p className="text-xs text-blue-700 mt-1">
              请使用管理员分发的账号密码登录
            </p>
            <p className="text-xs text-blue-600 mt-1">
              如需账号，请联系管理员
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
