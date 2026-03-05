import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, TrendingUp, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getTrendingLists } from '@/db/api';
import type { TrendingType, TrendingItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const PLATFORM_MAP: Record<string, { type: TrendingType; name: string }> = {
  '小红薯': { type: '14', name: '小红薯热榜' },
  '抖音': { type: '6', name: '抖音热榜' },
};

const OTHER_PLATFORMS: Array<{ type: TrendingType; name: string }> = [
  { type: '2', name: '微博热榜' },
  { type: '7', name: '知乎热榜' },
  { type: '8', name: 'B站热榜' },
  { type: '4', name: '百度热榜' },
  { type: '3', name: '头条热榜' },
  { type: '10', name: '快手热榜' },
  { type: '9', name: '贴吧热议榜' },
];

export default function CompetitorAnalysisPage() {
  const location = useLocation();
  const platform = (location.state as { platform?: string })?.platform || '小红薯';
  const platformConfig = PLATFORM_MAP[platform] || PLATFORM_MAP['小红薯'];
  const [selectedPlatform, setSelectedPlatform] = useState<TrendingType>(platformConfig.type);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrendingItem[]>([]);

  const allPlatforms = [
    PLATFORM_MAP['小红薯'],
    PLATFORM_MAP['抖音'],
    ...OTHER_PLATFORMS,
  ];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await getTrendingLists(selectedPlatform);
      
      if (data?.data && Array.isArray(data.data)) {
        setResults(data.data);
        
      } else {
        setResults([]);
        toast.info('暂无数据');
      }
    } catch (error) {
      toast.error('查询失败，请稍后重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background pb-20">
      {/* 头部 */}
      <div className="bg-gradient-primary text-primary-foreground px-6 py-6 rounded-b-3xl shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">分析同行</h1>
            <p className="text-sm opacity-90">当前平台：{platform}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* 平台选择 */}
        <Card>
          <CardHeader>
            <CardTitle>选择平台</CardTitle>
            <CardDescription>查看各平台热榜内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>热榜平台</Label>
              <Select value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as TrendingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allPlatforms.map((p) => (
                    <SelectItem key={p.type} value={p.type}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} className="w-full" disabled={loading}>
              {loading ? '查询中...' : '查看热榜'}
            </Button>
          </CardContent>
        </Card>

        {/* 结果列表 */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4 bg-muted" />
                  <Skeleton className="h-4 w-1/2 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((item, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary text-primary-foreground font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-semibold leading-tight">{item.title}</h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>热度: {item.hot.toLocaleString()}</span>
                        </div>
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            查看详情
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无数据</p>
              <p className="text-sm text-muted-foreground mt-1">选择平台后点击查看热榜</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
