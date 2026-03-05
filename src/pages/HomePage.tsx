import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  FileText,
  Sparkles,
  Zap,
  TrendingUp,
  Brain,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import type { PlatformType } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<PlatformType>('xiaohongshu');

  // 将平台类型转换为显示文本
  const getPlatformDisplayName = (platformType: PlatformType): string => {
    return platformType === 'xiaohongshu' ? '小红薯' : '抖音';
  };

  const features = [
    {
      id: 'my-product',
      title: '我有产品',
      description: '管理产品，一键生成文案和视频',
      icon: Package,
      bgColor: 'bg-card-purple',
      iconColor: 'text-primary',
      path: '/my-product',
      badge: '核心',
      badgeColor: 'bg-gradient-pink-orange',
    },
    {
      id: 'product-selection',
      title: '帮我选品',
      description: '智能选品，发现爆款商品',
      icon: ShoppingBag,
      bgColor: 'bg-card-orange',
      iconColor: 'text-warning',
      path: '/product-selection',
      badge: '热门',
      badgeColor: 'bg-gradient-cyan-blue',
    },
    {
      id: 'competitor-analysis',
      title: '分析同行',
      description: '竞品分析，洞察市场趋势',
      icon: Users,
      bgColor: 'bg-card-green',
      iconColor: 'text-success',
      path: '/competitor-analysis',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'content-creation',
      title: '图文创作',
      description: 'AI创作，高效产出内容',
      icon: FileText,
      bgColor: 'bg-card-blue',
      iconColor: 'text-accent',
      path: '/content-creation',
      badge: 'AI',
      badgeColor: 'bg-gradient-green-yellow',
    },
    {
      id: 'cognitive-awakening',
      title: '认知觉醒',
      description: '智能体问答，提升认知能力',
      icon: Brain,
      bgColor: 'bg-card-pink',
      iconColor: 'text-secondary',
      path: '/cognitive-awakening',
      badge: '智能',
      badgeColor: 'bg-gradient-purple-blue',
    },
    {
      id: 'image-factory',
      title: '图片工厂',
      description: 'AI生成小红书风格配图',
      icon: ImageIcon,
      bgColor: 'bg-card-yellow',
      iconColor: 'text-warning',
      path: '/image-factory',
      badge: 'AI',
      badgeColor: 'bg-gradient-pink-orange',
    },
    {
      id: 'ecommerce-video',
      title: '电商视频',
      description: '智能生成带货短视频',
      icon: Video,
      bgColor: 'bg-card-purple',
      iconColor: 'text-primary',
      path: '/ecommerce-video',
      badge: '爆款',
      badgeColor: 'bg-gradient-gold',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 头部横幅 - 花哨渐变+插画风格 */}
      <div className="relative overflow-hidden bg-gradient-rainbow text-white px-6 py-12 shadow-heavy">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-white/30 backdrop-blur-md flex items-center justify-center shadow-neon animate-pulse-scale">
                <Sparkles className="w-9 h-9 animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight drop-shadow-lg">自媒体创作</h1>
                <p className="text-base font-bold flex items-center gap-1.5 mt-1.5 drop-shadow-md">
                  <Zap className="w-4 h-4 animate-bounce-soft" />
                  坐稳请扶好
                </p>
              </div>
            </div>
            <Badge className="bg-gradient-gold text-gold-foreground border-0 shadow-gold px-4 py-2 text-sm font-black animate-wiggle">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              热门
            </Badge>
          </div>
        </div>
        
        {/* 装饰性背景元素 - 增强版 */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-neon-pink/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-neon-cyan/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-neon-yellow/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 left-1/3 w-24 h-24 bg-white/20 rounded-full blur-xl animate-pulse-scale" />
        
        {/* 装饰性图形 */}
        <div className="absolute top-4 right-8 w-12 h-12 border-4 border-white/40 rounded-full animate-spin-slow" />
        <div className="absolute bottom-6 left-12 w-8 h-8 bg-white/30 rotate-45 animate-wiggle" />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 平台选择 - 花哨样式 */}
        <div className="space-y-3">
          <Tabs 
            value={platform} 
            onValueChange={(v) => setPlatform(v as PlatformType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-16 bg-gradient-purple-blue border-2 border-gold shadow-colorful p-1.5 rounded-2xl">
              <TabsTrigger 
                value="xiaohongshu" 
                className="text-base font-black data-[state=active]:bg-gradient-gold data-[state=active]:text-gold-foreground data-[state=active]:shadow-gold rounded-xl transition-all data-[state=active]:scale-105"
              >
                <span className="text-2xl mr-2 animate-bounce-soft">📕</span>
                小红薯冲冲冲
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 功能卡片网格 - 花哨彩色卡片 */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.id}
                className="group relative overflow-hidden cursor-pointer border-2 border-transparent hover:border-gold bg-card shadow-heavy hover:shadow-neon active:scale-95 transition-all duration-300 card-float rounded-2xl"
                onClick={() => navigate(feature.path, { state: { platform: getPlatformDisplayName(platform) } })}
                style={{
                  animation: `fade-in 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <CardContent className="p-5 space-y-4 relative z-10">
                  {/* 图标容器 - 彩色背景 */}
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-3xl ${feature.bgColor} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg`}>
                      <Icon className={`w-8 h-8 ${feature.iconColor} group-hover:animate-bounce-soft`} />
                    </div>
                    {/* 角标 - 渐变背景 */}
                    {feature.badge && (
                      <Badge 
                        className={`absolute -top-2 -right-2 text-xs px-2.5 py-1 ${feature.badgeColor} text-white border-0 shadow-neon font-black animate-pulse-scale`}
                      >
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 文字内容 */}
                  <div className="space-y-2">
                    <h3 className="font-black text-lg text-foreground group-hover:text-gradient-purple transition-all">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 font-medium">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
                
                {/* 背景装饰 - 彩色渐变 */}
                <div className={`absolute inset-0 ${feature.bgColor} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              </Card>
            );
          })}
        </div>

        {/* 底部提示 - 花哨样式 */}
        <div className="text-center pt-4 space-y-2">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-cyan-blue shadow-colorful">
            <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
            <p className="text-sm text-white font-black">
              选择功能开始创作之旅
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
