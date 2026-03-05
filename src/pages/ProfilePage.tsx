import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Phone, LogOut, Shield, Zap, History, ChevronRight, Package, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { getUserCredits, getUserStatistics } from '@/db/api';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number>(0);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [statistics, setStatistics] = useState({
    productCount: 0,
    creationCount: 0,
    analysisCount: 0,
    imageFactoryCount: 0,
    videoGenerationCount: 0,
  });
  const [loadingStatistics, setLoadingStatistics] = useState(true);

  useEffect(() => {
    loadCredits();
    loadStatistics();
  }, []);

  const loadCredits = async () => {
    try {
      setLoadingCredits(true);
      const creditsData = await getUserCredits();
      setCredits(creditsData);
    } catch (error) {
      console.error('获取灵感值失败:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoadingStatistics(true);
      const stats = await getUserStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoadingStatistics(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    
    navigate('/login', { replace: true });
  };

  const getInitial = () => {
    if (profile?.phone) {
      return profile.phone.slice(-4);
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 头部 - 花哨渐变 */}
      <div className="bg-gradient-rainbow text-white px-6 py-10 rounded-b-[2rem] shadow-heavy relative overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <Avatar className="w-24 h-24 border-4 border-white shadow-neon animate-pulse-scale">
            <AvatarFallback className="bg-gradient-gold text-gold-foreground text-2xl font-black">
              {getInitial()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-black drop-shadow-lg">
              {profile?.phone ? `用户 ${profile.phone.slice(-4)}` : '用户'}
            </h2>
            {profile?.role === 'admin' && (
              <div className="flex items-center justify-center gap-1.5 mt-2 text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Shield className="w-4 h-4" />
                <span>管理员</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-6 space-y-4">
        {/* 灵感值卡片 - 花哨渐变 */}
        <Card className="bg-gradient-pink-orange border-0 text-white shadow-colorful overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center animate-pulse-scale">
                    <Zap className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold">我的灵感值</p>
                </div>
                <p className="text-3xl font-bold">
                  {loadingCredits ? '...' : credits}
                </p>
              </div>
              <div className="flex flex-col gap-2">

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 active:bg-white/30 btn-press-effect min-touch-target"
                  onClick={() => navigate('/credits/history')}
                >
                  <History className="w-4 h-4 mr-1" />
                  消费记录
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 数据统计卡片 - 彩色圆形图标 */}
        <Card className="shadow-heavy border-2 border-transparent hover:border-gold transition-all">
          <CardContent className="p-6">
            <h3 className="text-xl font-black mb-6 text-gradient-purple">数据统计</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* 产品数 - 蓝紫色 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-purple-blue shadow-colorful flex items-center justify-center mb-3 animate-pulse-scale">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <p className="text-3xl font-black text-primary">
                  {loadingStatistics ? '...' : statistics.productCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-bold">产品数</p>
              </div>

              {/* 创作数 - 粉橙色 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-pink-orange shadow-neon flex items-center justify-center mb-3 animate-pulse-scale" style={{ animationDelay: '0.2s' }}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="text-3xl font-black text-secondary">
                  {loadingStatistics ? '...' : statistics.creationCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-bold">创作数</p>
              </div>

              {/* 分析数 - 青蓝色 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-cyan-blue shadow-colorful flex items-center justify-center mb-3 animate-pulse-scale" style={{ animationDelay: '0.4s' }}>
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <p className="text-3xl font-black text-accent">
                  {loadingStatistics ? '...' : statistics.analysisCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-bold">分析数</p>
              </div>
            </div>

            {/* 详细统计 - 彩色背景 */}
            <div className="mt-6 pt-6 border-t-2 border-gold/30 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-card-yellow">
                <span className="text-sm font-bold text-foreground">图片工厂使用</span>
                <span className="text-lg font-black text-warning">{loadingStatistics ? '...' : statistics.imageFactoryCount} 次</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-card-green">
                <span className="text-sm font-bold text-foreground">电商视频生成</span>
                <span className="text-lg font-black text-success">{loadingStatistics ? '...' : statistics.videoGenerationCount} 次</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 用户信息 */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">用户ID</p>
                <p className="font-medium truncate">{user?.id.slice(0, 8)}...</p>
              </div>
            </div>
            
            {profile?.phone && (
              <div className="flex items-center gap-3 py-2 border-t border-border">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">手机号</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground mt-1">产品数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-secondary">0</p>
              <p className="text-xs text-muted-foreground mt-1">创作数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">分析数</p>
            </CardContent>
          </Card>
        </div>

        {/* 退出登录 */}
        <Button 
          variant="destructive" 
          className="w-full"
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          退出登录
        </Button>
      </div>
    </div>
  );
}
