import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserPlus, LogOut, RefreshCw, Trash2, Ban, CheckCircle, Copy, Download, Clock } from 'lucide-react';
import { generateAccount, getAllAccounts, updateAccountStatus, deleteAccount, resetAccountPassword, extendAccountExpiry } from '@/db/api';

interface UserAccount {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  expires_at: string;
  notes: string | null;
}

interface AdminUser {
  adminId: string;
  username: string;
  displayName: string;
  isSuperAdmin: boolean;
}

export default function AccountManagementPage() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBatchCreateDialogOpen, setIsBatchCreateDialogOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const navigate = useNavigate();

  // 单个创建表单
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // 批量创建表单
  const [batchCount, setBatchCount] = useState(10);
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchResult, setBatchResult] = useState<Array<{ username: string; password: string }>>([]);

  useEffect(() => {
    // 检查管理员登录状态
    const adminData = localStorage.getItem('admin_user');
    if (!adminData) {
      toast.error('请先登录管理员账号');
      navigate('/admin/login');
      return;
    }

    try {
      const admin = JSON.parse(adminData) as AdminUser;
      setAdminUser(admin);
      loadAccounts();
    } catch (error) {
      console.error('解析管理员信息失败:', error);
      navigate('/admin/login');
    }
  }, [navigate]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await getAllAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('加载账号列表失败:', error);
      toast.error('加载账号列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    toast.success('已退出登录');
    navigate('/admin/login');
  };

  const handleCreateAccount = async () => {
    if (!newUsername || !newPassword) {
      toast.error('请输入用户名和密码');
      return;
    }

    setCreating(true);
    try {
      const result = await generateAccount(newUsername, newPassword, newDisplayName, newNotes);
      
      if (result.success) {
        toast.success('账号创建成功');
        setIsCreateDialogOpen(false);
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        setNewNotes('');
        loadAccounts();
      } else {
        toast.error(result.message || '创建失败');
      }
    } catch (error) {
      console.error('创建账号异常:', error);
      toast.error('创建账号异常');
    } finally {
      setCreating(false);
    }
  };

  const handleBatchCreate = async () => {
    if (batchCount < 1 || batchCount > 100) {
      toast.error('批量创建数量必须在1-100之间');
      return;
    }

    setBatchCreating(true);
    const results: Array<{ username: string; password: string }> = [];
    let successCount = 0;
    let failCount = 0;

    // 生成随机用户名的函数
    const generateRandomUsername = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const length = 8 + Math.floor(Math.random() * 5); // 8-12位
      let username = '';
      // 第一个字符必须是字母
      username += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
      // 后续字符可以是字母或数字
      for (let i = 1; i < length; i++) {
        username += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return username;
    };

    // 生成随机密码的函数
    const generateRandomPassword = () => {
      const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
      const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const allChars = lowerChars + upperChars + numbers;
      const length = 10 + Math.floor(Math.random() * 3); // 10-12位
      
      let password = '';
      // 确保至少包含一个小写字母、一个大写字母和一个数字
      password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
      password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
      
      // 填充剩余字符
      for (let i = 3; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      
      // 打乱密码字符顺序
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    try {
      for (let i = 1; i <= batchCount; i++) {
        let username = generateRandomUsername();
        const password = generateRandomPassword();
        
        // 检查用户名是否已存在，如果存在则重新生成
        let retryCount = 0;
        while (retryCount < 5) {
          const result = await generateAccount(username, password, `随机用户${i}`, `批量随机创建`);
          
          if (result.success) {
            results.push({ username, password });
            successCount++;
            break;
          } else if (result.message?.includes('用户名已存在')) {
            // 用户名重复，重新生成
            username = generateRandomUsername();
            retryCount++;
          } else {
            // 其他错误
            failCount++;
            console.error(`创建 ${username} 失败:`, result.message);
            break;
          }
        }
        
        if (retryCount >= 5) {
          failCount++;
          console.error(`创建账号失败：尝试5次后仍然用户名重复`);
        }
      }

      setBatchResult(results);
      toast.success(`批量创建完成！成功：${successCount}，失败：${failCount}`);
      loadAccounts();
    } catch (error) {
      console.error('批量创建异常:', error);
      toast.error('批量创建异常');
    } finally {
      setBatchCreating(false);
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const success = await updateAccountStatus(accountId, newStatus);
    
    if (success) {
      toast.success(newStatus ? '账号已启用' : '账号已禁用');
      loadAccounts();
    } else {
      toast.error('操作失败');
    }
  };

  const handleDeleteAccount = async (accountId: string, username: string) => {
    if (!confirm(`确定要删除账号 ${username} 吗？此操作不可恢复！`)) {
      return;
    }

    const success = await deleteAccount(accountId);
    
    if (success) {
      toast.success('账号已删除');
      loadAccounts();
    } else {
      toast.error('删除失败');
    }
  };

  const handleResetPassword = async (accountId: string, username: string) => {
    const newPassword = prompt(`请输入 ${username} 的新密码：`);
    if (!newPassword) return;

    const result = await resetAccountPassword(accountId, newPassword);
    
    if (result.success) {
      toast.success('密码重置成功');
    } else {
      toast.error(result.message || '重置失败');
    }
  };

  // 计算剩余天数
  const calculateRemainingDays = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 获取过期状态Badge
  const getExpiryBadge = (expiresAt: string) => {
    const remainingDays = calculateRemainingDays(expiresAt);
    
    if (remainingDays < 0) {
      return <Badge variant="destructive">已过期</Badge>;
    } else if (remainingDays <= 3) {
      return <Badge className="bg-red-500">剩余{remainingDays}天</Badge>;
    } else if (remainingDays <= 7) {
      return <Badge className="bg-yellow-500">剩余{remainingDays}天</Badge>;
    } else {
      return <Badge className="bg-green-500">剩余{remainingDays}天</Badge>;
    }
  };

  // 续期处理
  const handleExtendExpiry = async (userId: string, username: string) => {
    const daysInput = prompt(`请输入要延长的天数（默认30天）：`, '30');
    if (!daysInput) return;

    const days = parseInt(daysInput);
    if (isNaN(days) || days < 1 || days > 365) {
      toast.error('天数必须在1-365之间');
      return;
    }

    try {
      const result = await extendAccountExpiry(userId, days);
      
      if (result.success) {
        toast.success(`账号 ${username} 已续期${days}天`);
        loadAccounts();
      } else {
        toast.error(result.message || '续期失败');
      }
    } catch (error) {
      console.error('续期异常:', error);
      toast.error('续期异常');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const downloadBatchResult = () => {
    const content = batchResult.map(item => `${item.username}\t${item.password}`).join('\n');
    const blob = new Blob([`用户名\t密码\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `账号列表_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('已下载账号列表');
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 头部 */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  账号管理后台
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 font-bold">
                  欢迎，{adminUser?.displayName} ({adminUser?.username})
                  {adminUser?.isSuperAdmin && <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500">超级管理员</Badge>}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="font-bold">
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* 操作按钮 */}
        <Card className="border-2 shadow-lg">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 font-black"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                创建单个账号
              </Button>
              <Button
                onClick={() => setIsBatchCreateDialogOpen(true)}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 font-black"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                批量创建账号
              </Button>
              <Button
                onClick={loadAccounts}
                variant="outline"
                className="font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新列表
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 账号列表 */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-black">
              账号列表 <Badge variant="secondary" className="ml-2">{accounts.length} 个账号</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">加载中...</p>
            ) : accounts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">暂无账号</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-black">用户名</TableHead>
                      <TableHead className="font-black">显示名称</TableHead>
                      <TableHead className="font-black">状态</TableHead>
                      <TableHead className="font-black">有效期</TableHead>
                      <TableHead className="font-black">创建时间</TableHead>
                      <TableHead className="font-black">最后登录</TableHead>
                      <TableHead className="font-black">备注</TableHead>
                      <TableHead className="font-black text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-bold">{account.username}</TableCell>
                        <TableCell>{account.display_name || '-'}</TableCell>
                        <TableCell>
                          {account.is_active ? (
                            <Badge className="bg-green-500">正常</Badge>
                          ) : (
                            <Badge variant="destructive">已禁用</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getExpiryBadge(account.expires_at)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(account.expires_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(account.created_at).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {account.last_login_at ? new Date(account.last_login_at).toLocaleString('zh-CN') : '从未登录'}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {account.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(account.username)}
                              title="复制用户名"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtendExpiry(account.user_id, account.username)}
                              title="延长有效期"
                            >
                              <Clock className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(account.id, account.username)}
                              title="重置密码"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={account.is_active ? 'outline' : 'default'}
                              onClick={() => handleToggleStatus(account.id, account.is_active)}
                              title={account.is_active ? '禁用账号' : '启用账号'}
                            >
                              {account.is_active ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAccount(account.id, account.username)}
                              title="删除账号"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 创建单个账号对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black">创建新账号</DialogTitle>
            <DialogDescription>
              填写账号信息，创建新的用户账号
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-bold">
                用户名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold">
                密码 <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入密码"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPassword}
                  title="生成随机密码"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="font-bold">
                显示名称
              </Label>
              <Input
                id="displayName"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="请输入显示名称（可选）"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-bold">
                备注
              </Label>
              <Textarea
                id="notes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="请输入备注信息（可选）"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateAccount}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 font-black"
              >
                {creating ? '创建中...' : '创建账号'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="font-bold"
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 批量创建账号对话框 */}
      <Dialog open={isBatchCreateDialogOpen} onOpenChange={setIsBatchCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">批量创建账号</DialogTitle>
            <DialogDescription>
              批量生成账号，每个账号的用户名和密码都是随机生成的，确保唯一性和安全性
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchCount" className="font-bold">
                创建数量 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="batchCount"
                type="number"
                min="1"
                max="100"
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                placeholder="1-100"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-bold text-blue-900">
                💡 随机生成规则：
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• 用户名：8-12位随机字母+数字组合</li>
                <li>• 密码：10-12位随机字母（大小写）+数字组合</li>
                <li>• 每个账号的用户名和密码都不相同</li>
                <li>• 创建完成后请及时下载保存</li>
              </ul>
            </div>

            {batchResult.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-green-600">
                    ✅ 创建成功 ({batchResult.length} 个账号)
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadBatchResult}
                    className="font-bold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载账号列表
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-bold">用户名</th>
                        <th className="text-left py-2 font-bold">密码</th>
                        <th className="text-right py-2 font-bold">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchResult.map((item, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-2 font-mono">{item.username}</td>
                          <td className="py-2 font-mono">{item.password}</td>
                          <td className="py-2 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(`${item.username}\t${item.password}`)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleBatchCreate}
                disabled={batchCreating}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 font-black"
              >
                {batchCreating ? '创建中...' : '开始批量创建'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsBatchCreateDialogOpen(false);
                  setBatchResult([]);
                }}
                className="font-bold"
              >
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
