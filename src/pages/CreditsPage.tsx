import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCreditPackages, getUserCredits, createCreditOrder } from '@/db/api';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  sort_order: number;
}

export default function CreditsPage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packagesData, creditsData] = await Promise.all([
        getCreditPackages(),
        getUserCredits()
      ]);
      setPackages(packagesData);
      setCurrentCredits(creditsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasing(packageId);
      const { orderNo } = await createCreditOrder(packageId);
      
      // 跳转到订单详情页面
      navigate(`/order/${orderNo}`);
    } catch (error: any) {
      console.error('创建订单失败:', error);
      toast.error(error.message || '创建订单失败');
    } finally {
      setPurchasing(null);
    }
  };

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
        <h1 className="text-lg font-semibold text-foreground">灵感值充值</h1>
        <div className="w-12"></div>
      </header>

      {/* 主内容区域 */}
      <div className="p-4 space-y-4 pb-20">
        {/* 当前灵感值 */}
        <Card className="bg-gradient-primary border-0 text-white shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">当前灵感值</p>
                <p className="text-4xl font-bold">{currentCredits}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
              <p className="text-sm text-text-secondary flex-1">
                生成一次电商视频消耗 <span className="text-orange font-semibold">10灵感</span>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
              <p className="text-sm text-text-secondary flex-1">
                图片工厂每天免费使用 <span className="text-success font-semibold">2次</span>，超过后每次消耗 <span className="text-orange font-semibold">5灵感</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 充值套餐 */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground px-1">选择充值套餐</h2>
          <div className="grid grid-cols-1 gap-3">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className="bg-card border-border shadow-card hover:shadow-hover transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-5 h-5 text-orange" />
                        <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {pkg.credits}灵感 = {(pkg.credits / 10).toFixed(0)}次视频生成
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-2xl font-bold text-orange">¥{pkg.price}</p>
                      <Button
                        className="min-touch-target bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground btn-press-effect"
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={purchasing === pkg.id}
                      >
                        {purchasing === pkg.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            处理中...
                          </>
                        ) : (
                          '立即充值'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 温馨提示 */}
        <Card className="bg-muted border-border">
          <CardContent className="p-4">
            <p className="text-xs text-text-weak leading-relaxed">
              温馨提示：充值后的灵感值永久有效，不会过期。支付成功后灵感值将自动到账，如有疑问请联系客服。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
