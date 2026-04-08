import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Smartphone, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginWithAccount, registerWithAccount } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';

const PHONE_REGEX = /^1\d{10}$/;

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = (location.state as { from?: string } | null)?.from || '/';

  const validateForm = () => {
    if (!phone.trim() || !password) {
      toast.error('请输入手机号和密码');
      return false;
    }

    if (!PHONE_REGEX.test(phone.trim())) {
      toast.error('手机号必须是 11 位且以 1 开头');
      return false;
    }

    if (password.length < 6) {
      toast.error('密码长度至少需要 6 位');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = phone.trim();
      console.log('========== [LoginPage] handleSubmit ==========');
      console.log('[LoginPage] 登录模式:', isRegisterMode ? '注册' : '登录');
      console.log('[LoginPage] 手机号:', normalizedPhone);

      if (isRegisterMode) {
        console.log('[LoginPage] 开始注册...');
        const registerResult = await registerWithAccount(normalizedPhone, password, normalizedPhone);
        console.log('[LoginPage] 注册结果:', registerResult);

        if (!registerResult.success) {
          toast.error(registerResult.message || '注册失败');
          return;
        }

        console.log('[LoginPage] 注册成功，开始自动登录...');
        const loginResult = await loginWithAccount(normalizedPhone, password);
        console.log('[LoginPage] 登录结果:', loginResult);

        if (!loginResult.success) {
          toast.error(loginResult.message || '注册成功，但自动登录失败');
          return;
        }

        if (!loginResult.userId || loginResult.userId === '0') {
          console.error('[LoginPage] 注册成功但 userId 无效:', loginResult.userId);
          toast.error('注册成功，但用户 ID 无效');
          return;
        }

        login(loginResult.userId, loginResult.username || normalizedPhone, loginResult.displayName || normalizedPhone);
        console.log('[LoginPage] 注册并登录完成，准备跳转...');
        toast.success('注册并登录成功');
        navigate(from, { replace: true });
        return;
      }

      console.log('[LoginPage] 开始登录...');
      const loginResult = await loginWithAccount(normalizedPhone, password);
      console.log('[LoginPage] 登录结果:', loginResult);

      if (!loginResult.success) {
        toast.error(loginResult.message || '登录失败');
        return;
      }

      if (!loginResult.userId || loginResult.userId === '0') {
        console.error('[LoginPage] 登录成功但 userId 无效:', loginResult.userId);
        toast.error('登录失败：服务器返回的用户 ID 无效');
        return;
      }

      login(loginResult.userId, loginResult.username || normalizedPhone, loginResult.displayName || normalizedPhone);
      console.log('[LoginPage] 登录完成，准备跳转...');
      toast.success('登录成功');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('账号认证异常:', error);
      toast.error('认证异常，请稍后重试');
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
              自媒体创作助手
            </CardTitle>
            <CardDescription className="text-base mt-2 font-bold">
              {isRegisterMode ? '使用手机号注册账号' : '使用手机号密码登录'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                手机号
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入 11 位手机号"
                className="h-12 text-base"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={11}
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
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-black bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg"
              disabled={loading}
            >
              {loading ? '处理中...' : isRegisterMode ? '注册并登录' : '登录'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-bold"
              disabled={loading}
              onClick={() => setIsRegisterMode((prev) => !prev)}
            >
              {isRegisterMode ? '已有账号，去登录' : '没有账号，去注册'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 font-bold">温馨提示</p>
            <p className="text-xs text-blue-700 mt-1">
              当前页面使用手机号加密码登录。注册时会校验手机号必须为 11 位，注册成功后会直接自动登录。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}