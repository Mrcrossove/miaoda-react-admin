import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Video, Image as ImageIcon, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { getUserCreditUsage, getUserCredits } from '@/db/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreditUsage {
  id: string;
  user_id: string;
  credits: number;
  usage_type: 'video_generation' | 'image_factory';
  description: string | null;
  created_at: string;
}

const USAGE_TYPE_CONFIG = {
  video_generation: {
    icon: Video,
    text: '视频生成',
    color: 'text-primary'
  },
  image_factory: {
    icon: ImageIcon,
    text: '图片工厂',
    color: 'text-orange'
  }
};

export default function CreditHistoryPage() {
  const navigate = useNavigate();
  const [usageList, setUsageList] = useState<CreditUsage[]>([]);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'video_generation' | 'image_factory'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usageData, creditsData] = await Promise.all([
        getUserCreditUsage(),
        getUserCredits()
      ]);
      setUsageList(usageData);
      setCurrentCredits(creditsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const filteredUsageList = activeTab === 'all' 
    ? usageList 
    : usageList.filter(item => item.usage_type === activeTab);

  const totalConsumed = usageList.reduce((sum, item) => sum + item.credits, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="h-12 safe-area-top bg-card border-b border-border flex items-center justify-between px-4">
        <button 
          className="min-touch-target flex items-center justify-center"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">消费记录</h1>
        <div className="w-12"></div>
      </header>
      {/* 主内容区域 */}
      <div className="p-4 space-y-4 pb-20">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-700 border-0 text-white shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" />
                <p className="text-xs opacity-90">当前余额</p>
              </div>
              <p className="text-2xl font-bold">{currentCredits}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-text-secondary" />
                <p className="text-xs text-text-secondary">累计消费</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalConsumed}</p>
            </CardContent>
          </Card>
        </div>

        {/* 筛选标签 */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-muted">
            <TabsTrigger value="all" className="text-sm">全部</TabsTrigger>
            <TabsTrigger value="video_generation" className="text-sm">视频生成</TabsTrigger>
            <TabsTrigger value="image_factory" className="text-sm">图片工厂</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filteredUsageList.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <Zap className="w-12 h-12 text-text-weak" />
                    <p className="text-sm text-text-secondary">暂无消费记录</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredUsageList.map((item) => {
                const config = USAGE_TYPE_CONFIG[item.usage_type];
                const Icon = config.icon;

                return (
                  <Card key={item.id} className="bg-card border-border shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{config.text}</p>
                            {item.description && (
                              <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                            )}
                            <p className="text-xs text-text-weak mt-1">{formatDate(item.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange">-{item.credits}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
