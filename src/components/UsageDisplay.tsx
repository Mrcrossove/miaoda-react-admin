import { useState, useEffect } from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import { getUserUsage } from '@/db/api';
import { isValidUUID } from '@/utils/uuid';

interface UsageDisplayProps {
  userId: string;
  feature: 'image_factory' | 'ecommerce_video';
  onRefresh?: number;
}

export default function UsageDisplay({ userId, feature, onRefresh }: UsageDisplayProps) {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prevRemaining, setPrevRemaining] = useState<number | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const loadUsage = async () => {
    console.log('========== [UsageDisplay] loadUsage ==========');
    console.log('[UsageDisplay] userId:', userId);
    console.log('[UsageDisplay] isValidUUID(userId):', isValidUUID(userId));
    console.log('[UsageDisplay] feature:', feature);
    
    if (!userId || !isValidUUID(userId)) {
      console.log('[UsageDisplay] ❌ userId 无效，使用默认值');
      setLoading(false);
      return;
    }
    
    console.log('[UsageDisplay] ✅ userId 有效，开始加载...');
    setLoading(true);
    try {
      const data = await getUserUsage(userId);
      console.log('[UsageDisplay] getUserUsage 返回:', data);
      console.log('[UsageDisplay] data 类型:', typeof data);
      console.log('[UsageDisplay] data.image_factory_remaining:', data?.image_factory_remaining);
    
      if (data) {
        console.log('[UsageDisplay] ✅ 成功加载使用次数');
        const isImageFactory = feature === 'image_factory';
        const currentRemaining = isImageFactory ? data.image_factory_remaining : data.ecommerce_video_remaining;
        console.log('[UsageDisplay] 当前剩余次数:', currentRemaining);
        
        // 检测次数变化，触发动画
        if (prevRemaining !== null && currentRemaining < prevRemaining) {
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 1000);
        }
        
        setPrevRemaining(currentRemaining);
      } else {
        console.warn('[UsageDisplay] ❌ getUserUsage 返回 null 或 undefined');
      }
      
      setUsage(data);
    } catch (error) {
      console.error('[UsageDisplay] ❌ 加载使用次数失败:', error);
      // 如果是网络错误，设置 usage 为 null 以避免阻塞界面
      setUsage(null);
    } finally {
      setLoading(false);
      console.log('========== [UsageDisplay] loadUsage 结束 ==========');
    }
  };

  useEffect(() => {
    loadUsage();
  }, [userId, onRefresh]);

  // 如果没有userId，显示默认次数（未登录状态）
  if (!userId) {
    const isImageFactory = feature === 'image_factory';
    const limit = isImageFactory ? 12 : 7;
    
    return (
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 shadow-2xl">
        <Zap className="w-7 h-7 text-white" />
        <div className="flex flex-col items-end">
          <span className="text-xs font-black text-white/90">剩余次数</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white leading-tight">
              {limit}
            </span>
            <span className="text-lg font-bold text-white/80">/{limit}</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40">
        <div className="animate-pulse flex items-center gap-3">
          <Zap className="w-7 h-7 text-white" />
          <div>
            <div className="h-3 bg-white/40 rounded w-16 mb-1"></div>
            <div className="h-5 bg-white/40 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const isImageFactory = feature === 'image_factory';
  const remaining = isImageFactory ? usage.image_factory_remaining : usage.ecommerce_video_remaining;
  const limit = isImageFactory ? usage.image_factory_limit : usage.ecommerce_video_limit;
  const creditsCost = isImageFactory ? 10 : 20;

  const isLowUsage = remaining <= 2 && remaining > 0;
  const isNoUsage = remaining === 0;

  return (
    <div 
      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 shadow-2xl transition-all ${
        isNoUsage 
          ? 'bg-red-500/90 border-red-300 animate-pulse' 
          : isLowUsage
          ? 'bg-yellow-500/90 border-yellow-300'
          : 'bg-white/20 backdrop-blur-md border-white/40'
      } ${showAnimation ? 'scale-110' : 'scale-100'}`}
    >
      <div className={`${showAnimation ? 'animate-bounce' : ''}`}>
        {isNoUsage ? (
          <AlertTriangle className="w-7 h-7 text-white" />
        ) : (
          <Zap className="w-7 h-7 text-white" />
        )}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-black text-white/90">
          {isNoUsage ? '次数已用完' : isLowUsage ? '次数不足' : '剩余次数'}
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-black text-white leading-tight ${showAnimation ? 'animate-pulse' : ''}`}>
            {remaining}
          </span>
          <span className="text-lg font-bold text-white/80">/{limit}</span>
        </div>
        {isNoUsage && (
          <span className="text-xs font-bold text-white/90 mt-0.5">
            {usage.credits_balance >= creditsCost ? `将消费${creditsCost}算力` : '算力不足'}
          </span>
        )}
      </div>
    </div>
  );
}
