import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Upload, Sparkles, FileText, Play, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductCategory, VideoDuration } from '@/utils/promptGenerator';
import MaterialUploadStep from '@/components/ecommerce-video/MaterialUploadStep';
import PromptGenerationStep from '@/components/ecommerce-video/PromptGenerationStep';
import PromptEditStep from '@/components/ecommerce-video/PromptEditStep';
import VideoGenerationStep from '@/components/ecommerce-video/VideoGenerationStep';
import UsageDisplay from '@/components/UsageDisplay';
import { checkAndConsumeUsage } from '@/db/selfHostedApi';
import { isValidUUID } from '@/utils/uuid';
import { useAuth } from '@/contexts/AuthContext';

// 步骤定义
type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, name: '上传素材', icon: Upload, description: '上传产品图和输入卖点' },
  { id: 2, name: '生成提示词', icon: Sparkles, description: '大模型生成视频提示词' },
  { id: 3, name: '编辑提示词', icon: FileText, description: '查看和修改提示词' },
  { id: 4, name: '生成视频', icon: Play, description: '调用 SORA2 生成视频' },
];

export default function EcommerceVideoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // 所有 useState 必须在最前面
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productName, setProductName] = useState<string>('');
  const [sellingPoints, setSellingPoints] = useState<string>('');
  const [category, setCategory] = useState<ProductCategory>('通用');
  const [duration, setDuration] = useState<VideoDuration>(10);
  const [soraPrompt, setSoraPrompt] = useState<string>('');
  const [originalPrompt, setOriginalPrompt] = useState<string>('');

  // 等待 AuthContext 加载完成
  useEffect(() => {
    if (authLoading) return;

    if (!user?.id || !isValidUUID(user.id)) {
      console.error('[EcommerceVideoPage] 用户未登录或 ID 无效');
      navigate('/login', { state: { from: '/ecommerce-video' }, replace: true });
    }
  }, [authLoading, user, navigate]);

  // 接收从"我有产品"传递过来的参数
  useEffect(() => {
    if (authLoading || !user?.id) return;

    const state = location.state as {
      productImages?: string[];
      productName?: string;
      fromMyProduct?: boolean;
    };

    if (state?.fromMyProduct && state?.productImages && state?.productName) {
      setProductImages(state.productImages);
      setProductName(state.productName);
    }
  }, [location.state, authLoading, user]);

  // 加载中显示 loading
  if (authLoading || !user?.id || !isValidUUID(user.id)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const userId = user.id;

  const goNext = async () => {
    if (currentStep < 4) {
      if (currentStep === 3) {
        if (!userId || !isValidUUID(userId)) {
          toast.error('用户信息无效，请重新登录');
          navigate('/login', { state: { from: '/ecommerce-video' }, replace: true });
          return;
        }

        try {
          const result = await checkAndConsumeUsage(userId, 'ecommerce_video');

          if (!result.success) {
            toast.error(result.message);
            return;
          }

          if (result.consumed_type === 'free') {
            toast.success(`使用成功！剩余 ${result.remaining_free} 次免费机会`);
          } else if (result.consumed_type === 'credits') {
            toast.success(`使用成功！消费 20 算力，剩余 ${result.credits_balance}`);
          }

          setUsageRefreshKey(prev => prev + 1);
        } catch (error) {
          console.error('检查使用次数失败:', error);
          toast.error(error instanceof Error ? error.message : '系统错误');
          return;
        }
      }

      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handlePromptGenerated = (prompt: string) => {
    setSoraPrompt(prompt);
    setOriginalPrompt(prompt);
  };

  const handleReset = () => {
    setProductImages([]);
    setProductName('');
    setSellingPoints('');
    setCategory('通用');
    setDuration(10);
    setSoraPrompt('');
    setOriginalPrompt('');
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50">
      {/* 头部 - 固定在顶部 */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-[600px] mx-auto px-4 py-4">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">电商视频</h1>
                <p className="text-xs text-gray-500">AI 生成带货短视频</p>
              </div>
            </div>
            <UsageDisplay userId={userId} feature="ecommerce_video" onRefresh={usageRefreshKey} />
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? '✓' : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium ${
                        isActive ? 'text-purple-600' : 'text-gray-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-6 h-0.5 mx-1 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 内容区域 - 添加底部 padding 避免被导航栏遮挡 */}
      <div className="max-w-[600px] mx-auto px-4 py-4 pb-36">
        {currentStep === 1 && (
          <MaterialUploadStep
            productImages={productImages}
            productName={productName}
            sellingPoints={sellingPoints}
            category={category}
            duration={duration}
            onProductImagesChange={setProductImages}
            onProductNameChange={setProductName}
            onSellingPointsChange={setSellingPoints}
            onCategoryChange={setCategory}
            onDurationChange={setDuration}
            onNext={goNext}
          />
        )}

        {currentStep === 2 && (
          <PromptGenerationStep
            productName={productName}
            sellingPoints={sellingPoints}
            category={category}
            duration={duration}
            onPromptGenerated={handlePromptGenerated}
            onNext={goNext}
            onBack={goPrev}
          />
        )}

        {currentStep === 3 && (
          <PromptEditStep
            prompt={soraPrompt}
            originalPrompt={originalPrompt}
            onPromptChange={setSoraPrompt}
            onNext={goNext}
            onBack={goPrev}
          />
        )}

        {currentStep === 4 && (
          <VideoGenerationStep
            prompt={soraPrompt}
            duration={duration}
            onBack={() => setCurrentStep(3)}
            onReset={handleReset}
          />
        )}
      </div>

      {/* 底部导航按钮 - 仅在步骤 1-3 显示 */}
      {currentStep < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
          <div className="max-w-[600px] mx-auto px-4 py-3 flex gap-3">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentStep === 1}
              className="flex-1 h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              上一步
            </Button>
            <Button
              onClick={goNext}
              className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              下一步
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
