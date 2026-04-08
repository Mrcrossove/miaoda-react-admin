import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Users,
  FileText,
  Sparkles,
  Brain,
  Image as ImageIcon,
  Video,
  Crown,
  Bot,
} from 'lucide-react';
import type { PlatformType } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<PlatformType>('xiaohongshu');

  const platformLabel = platform === 'xiaohongshu' ? '小红书' : '抖音';
  const features = useMemo(
    () => [
      {
        id: 'my-product',
        title: '我有产品',
        description: '管理商品信息，快速生成图文与视频素材',
        icon: ShoppingBag,
        bgGradient: 'from-pink-100 to-pink-200',
        iconColor: 'text-pink-500',
        path: '/my-product',
      },
      {
        id: 'select-product',
        title: '帮我选品',
        description: '结合平台趋势，辅助判断更适合上新的品类',
        icon: Search,
        bgGradient: 'from-blue-100 to-blue-200',
        iconColor: 'text-blue-500',
        path: '/product-selection',
      },
      {
        id: 'competitor-analysis',
        title: '分析同行',
        description: '查看竞品思路，提炼适合你的内容方向',
        icon: Users,
        bgGradient: 'from-orange-100 to-orange-200',
        iconColor: 'text-orange-500',
        path: '/competitor-analysis',
      },
      {
        id: 'content-creation',
        title: '图文创作',
        description: 'AI 生成标题、正文与配图建议，缩短出稿时间',
        icon: FileText,
        bgGradient: 'from-yellow-100 to-yellow-200',
        iconColor: 'text-yellow-600',
        path: '/content-creation',
      },
      {
        id: 'cognitive-awakening',
        title: '认知觉醒',
        description: '围绕定位、表达与营销认知进行智能问答',
        icon: Brain,
        bgGradient: 'from-indigo-100 to-indigo-200',
        iconColor: 'text-indigo-500',
        path: '/cognitive-awakening',
      },
      {
        id: 'image-factory',
        title: '图片工厂',
        description: '生成更贴近小红书风格的封面和配图',
        icon: ImageIcon,
        bgGradient: 'from-rose-100 to-rose-200',
        iconColor: 'text-rose-500',
        path: '/image-factory',
      },
      {
        id: 'ecommerce-video',
        title: '电商视频',
        description: '组织素材与脚本，批量生成带货短视频',
        icon: Video,
        bgGradient: 'from-green-100 to-green-200',
        iconColor: 'text-green-500',
        path: '/ecommerce-video',
      },
      {
        id: 'ai-digital-human',
        title: 'AI数字人',
        description: '爆款仿写、法务审查、数字人口播，一条链路先跑通',
        icon: Bot,
        bgGradient: 'from-violet-100 to-fuchsia-200',
        iconColor: 'text-violet-500',
        path: '/ai-digital-human',
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50 px-6 pb-6 pt-8">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 p-6 shadow-xl">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20" />
        <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-white/15" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-black text-white">鲸小助</h1>
            <p className="text-sm font-medium text-white/90">AI 创作工具集</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/credits')}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
          >
            <Crown className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-bold text-white">我的会员</span>
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-1.5 shadow-lg">
        <div className="grid grid-cols-1 gap-1.5">
          <button
            type="button"
            onClick={() => setPlatform('xiaohongshu')}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 shadow-md transition-all active:scale-95"
          >
            <span className="text-sm font-bold text-white">{platformLabel}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              type="button"
              key={feature.id}
              onClick={() => navigate(feature.path, { state: { platform: platformLabel } })}
              className="group relative rounded-2xl bg-white p-6 shadow-md transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.bgGradient} shadow-sm transition-shadow group-hover:shadow-md`}
                >
                  <Icon className={`h-8 w-8 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5">
                  <div className="text-base font-bold text-gray-800">{feature.title}</div>
                  <p className="text-xs leading-5 text-gray-500">{feature.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-4 py-2 text-xs shadow-md">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="font-medium text-gray-700">小红书创作链路已就绪</span>
        </div>
      </div>
    </div>
  );
}
