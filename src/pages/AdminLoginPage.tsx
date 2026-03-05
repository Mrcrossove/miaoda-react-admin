import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Lock, User } from 'lucide-react';
import { loginAdmin } from '@/db/api';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const result = await loginAdmin(username, password);
      
      if (result.success) {
        // 保存管理员信息到localStorage
        localStorage.setItem('admin_user', JSON.stringify({
          adminId: result.adminId,
          username: result.username,
          displayName: result.displayName,
          isSuperAdmin: result.isSuperAdmin
        }));
        
        toast.success('登录成功');
        navigate('/admin/accounts');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              管理员登录
            </CardTitle>
            <CardDescription className="text-base mt-2 font-bold">
              账号生成管理后台
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4" />
                管理员账号
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入管理员账号"
                className="h-12 text-base"
                autoComplete="username"
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
              💡 默认管理员账号
            </p>
            <p className="text-xs text-blue-700 mt-1">
              账号：admin<br />
              密码：admin123
            </p>
            <p className="text-xs text-blue-600 mt-2">
              首次登录后请及时修改密码
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
