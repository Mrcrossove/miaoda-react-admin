import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getCreditOrder, getUserCredits, type CreditOrderDetail } from '@/db/selfHostedApi';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    text: '待支付',
    color: 'text-orange',
    bgColor: 'bg-orange/10'
  },
  paid: {
    icon: CheckCircle2,
    text: '已支付',
    color: 'text-success',
    bgColor: 'bg-success/10'
  },
  cancelled: {
    icon: XCircle,
    text: '已取消',
    color: 'text-text-weak',
    bgColor: 'bg-muted'
  },
  expired: {
    icon: XCircle,
    text: '已过期',
    color: 'text-text-weak',
    bgColor: 'bg-muted'
  }
};

export default function OrderDetailPage() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<CreditOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    if (orderNo) {
      loadOrderDetail();
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [orderNo]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const orderData = await getCreditOrder(orderNo!);
      
      if (!orderData) {
        toast.error('订单不存在');
        navigate('/credits');
        return;
      }

      setOrder(orderData);

      // 如果订单状态是待支付，开始轮询
      if (orderData.status === 'pending') {
        startPolling();
      } else if (orderData.status === 'paid') {
        // 如果已支付，获取最新灵感值
        const credits = await getUserCredits();
        setCurrentCredits(credits);
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      toast.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    // 每2秒轮询一次订单状态
    pollingRef.current = window.setInterval(async () => {
      try {
        const orderData = await getCreditOrder(orderNo!);
        
        if (orderData && orderData.status !== 'pending') {
          // 订单状态已改变，停止轮询
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setOrder(orderData);

          if (orderData.status === 'paid') {
            toast.success('支付成功！灵感值已到账');
            const credits = await getUserCredits();
            setCurrentCredits(credits);
          }
        }
      } catch (error) {
        console.error('轮询订单状态失败:', error);
      }
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">订单不存在</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

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
        <h1 className="text-lg font-semibold text-foreground">订单详情</h1>
        <div className="w-12"></div>
      </header>

      {/* 主内容区域 */}
      <div className="p-4 space-y-4 pb-20">
        {/* 订单状态 */}
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`w-16 h-16 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
                <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
              </div>
              <p className={`text-xl font-semibold ${statusConfig.color}`}>
                {statusConfig.text}
              </p>
              {order.status === 'paid' && currentCredits > 0 && (
                <p className="text-sm text-text-secondary">
                  当前灵感值：<span className="text-orange font-semibold">{currentCredits}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 支付二维码（仅待支付状态显示） */}
        {order.status === 'pending' && order.wechat_pay_url && (
          <Card className="bg-card border-border shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-base font-semibold text-foreground">微信扫码支付</p>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeDataUrl 
                    value={order.wechat_pay_url}
                    size={200}
                  />
                </div>
                <p className="text-sm text-text-secondary text-center">
                  请使用微信扫描二维码完成支付
                </p>
                <div className="flex items-center gap-2 text-xs text-text-weak">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>等待支付中...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 订单信息 */}
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-base font-semibold text-foreground mb-3">订单信息</h3>
            
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">订单号</span>
              <span className="text-sm text-foreground font-mono">{order.order_no}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">套餐名称</span>
              <span className="text-sm text-foreground font-semibold">{order.credit_packages.name}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">灵感值</span>
              <span className="text-sm text-orange font-semibold">{order.credits}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">支付金额</span>
              <span className="text-lg text-orange font-bold">¥{order.amount}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-secondary">创建时间</span>
              <span className="text-sm text-foreground">{formatDate(order.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        {order.status === 'paid' && (
          <Button
            className="w-full min-touch-target bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground btn-press-effect"
            onClick={() => navigate('/profile')}
          >
            返回个人中心
          </Button>
        )}
      </div>
    </div>
  );
}
