import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Edit,
  CreditCard,
  Clock,
  MessageSquare,
  Video,
  FileText,
  Image as ImageIcon,
  Palette,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { getUserCredits, getUserStatistics } from '@/db/selfHostedApi';
import { isValidUUID } from '@/utils/uuid';

export default function ProfilePage() {
  const { user, userInfo, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
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
    if (!user?.id || !isValidUUID(user.id)) {
      console.error('[ProfilePage] 用户 ID 无效，跳转到登录页');
      navigate('/login', { state: { from: '/profile' }, replace: true });
      return;
    }

    setIsCheckingAuth(false);

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

    void loadCredits();
    void loadStatistics();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const memberName = userInfo?.displayName || userInfo?.username || (user?.id ? `A${user.id.slice(0, 9)}` : '用户');

  const commonFeatures = useMemo(
    () => [
      {
        id: 'card',
        name: '卡密兑换',
        icon: CreditCard,
        iconColor: 'text-blue-300',
        gradient: 'from-blue-500/20 to-cyan-500/20',
        action: () => navigate('/credits'),
      },
      {
        id: 'update',
        name: '更新历史',
        icon: Clock,
        iconColor: 'text-pink-300',
        gradient: 'from-pink-500/20 to-rose-500/20',
        action: () => navigate('/credits/history'),
      },
      {
        id: 'feedback',
        name: '反馈建议',
        icon: MessageSquare,
        iconColor: 'text-cyan-300',
        gradient: 'from-cyan-500/20 to-blue-500/20',
        action: () => window.open('mailto:support@example.com', '_self'),
      },
      {
        id: 'video',
        name: '视频历史',
        icon: Video,
        iconColor: 'text-orange-300',
        gradient: 'from-orange-500/20 to-red-500/20',
        action: () => navigate('/ecommerce-video'),
      },
      {
        id: 'password',
        name: '修改密码',
        icon: Edit,
        iconColor: 'text-red-300',
        gradient: 'from-red-500/20 to-pink-500/20',
        action: () => navigate('/login'),
      },
      {
        id: 'notes',
        name: '笔记历史',
        icon: FileText,
        iconColor: 'text-purple-300',
        gradient: 'from-purple-500/20 to-pink-500/20',
        action: () => navigate('/content-creation'),
      },
      {
        id: 'background',
        name: '更换背景',
        icon: ImageIcon,
        iconColor: 'text-indigo-300',
        gradient: 'from-indigo-500/20 to-purple-500/20',
        action: () => navigate('/image-factory'),
      },
      {
        id: 'drawing',
        name: '绘画历史',
        icon: Palette,
        iconColor: 'text-pink-300',
        gradient: 'from-pink-500/20 to-purple-500/20',
        action: () => navigate('/image-factory'),
      },
      {
        id: 'ai',
        name: '攻瑰AI',
        icon: Sparkles,
        iconColor: 'text-yellow-300',
        gradient: 'from-yellow-500/20 to-orange-500/20',
        action: () => navigate('/cognitive-awakening'),
      },
    ],
    [navigate],
  );

  const statCards = [
    { label: '创作次数', value: loadingStatistics ? '...' : String(statistics.creationCount) },
    { label: '生成图片', value: loadingStatistics ? '...' : String(statistics.imageFactoryCount) },
    { label: '使用天数', value: loadingCredits ? '...' : String(Math.max(1, Math.floor(credits / 10) || 45)) },
  ];

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-violet-50 to-fuchsia-50 px-6 pb-8 pt-8">
      {/* 用户信息卡片 */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 p-6 shadow-xl">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/15 rounded-full" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Crown className="h-10 w-10 text-yellow-300" />
          </div>
          <div className="flex-1 pt-1">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{memberName}</h2>
              <button type="button" className="rounded-lg p-1.5 transition-colors hover:bg-white/20">
                <Edit className="h-4 w-4 text-white/80" />
              </button>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-sm">
              <Crown className="h-3.5 w-3.5 text-yellow-300" />
              <span className="font-medium text-white">会员至 2026-04-05</span>
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/20 backdrop-blur-sm p-3 text-center">
              <div className="mb-1 text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 账户概览 */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500">剩余灵感值</div>
            <div className="mt-1 text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {loadingCredits ? '...' : credits}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-4 text-purple-700 hover:bg-purple-200 hover:text-purple-800 font-medium"
            onClick={() => navigate('/credits/history')}
          >
            消费记录
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-3 text-gray-700 font-medium">
            产品数 {loadingStatistics ? '...' : statistics.productCount}，分析数 {loadingStatistics ? '...' : statistics.analysisCount}
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-gray-700 font-medium">
            图片工厂 {loadingStatistics ? '...' : statistics.imageFactoryCount} 次，视频 {loadingStatistics ? '...' : statistics.videoGenerationCount} 次
          </div>
        </div>
      </div>

      {/* 常用功能 */}
      <div className="mb-6">
        <h3 className="mb-4 text-sm font-bold text-gray-600">常用功能</h3>
        <div className="grid grid-cols-2 gap-3">
          {commonFeatures.map((feature) => {
            const Icon = feature.icon;

            return (
              <button
                type="button"
                key={feature.id}
                onClick={feature.action}
                className="rounded-2xl bg-white p-5 text-left shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-sm`}
                  >
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-bold text-gray-800">{feature.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm shadow-md border border-gray-100">
          <span className="font-medium text-gray-700">渡鸦科技</span>
          <span className="text-gray-400">x</span>
          <span className="font-medium text-gray-700">项目神</span>
          <span className="text-gray-500">倾力共创</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
          <button type="button" className="transition-colors hover:text-purple-600 font-medium">
            用户协议
          </button>
          <span>·</span>
          <button type="button" className="transition-colors hover:text-purple-600 font-medium">
            隐私政策
          </button>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mx-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm text-gray-500 transition-colors hover:text-purple-600 font-medium"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>
    </div>
  );
}
