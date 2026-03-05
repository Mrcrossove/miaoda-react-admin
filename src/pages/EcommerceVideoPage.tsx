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
import { checkAndConsumeUsage } from '@/db/api';
import { getUserIdFromStorage, isValidUUID } from '@/utils/uuid';

// 步骤定义
type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, name: '上传素材', icon: Upload, description: '上传产品图和输入卖点' },
  { id: 2, name: '生成提示词', icon: Sparkles, description: '大模型生成视频提示词' },
  { id: 3, name: '编辑提示词', icon: FileText, description: '查看和修改提示词' },
  { id: 4, name: '生成视频', icon: Play, description: '调用SORA2生成视频' },
];

export default function EcommerceVideoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // 使用次数刷新计数器
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  
  // 获取用户ID
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    const validUserId = getUserIdFromStorage();
    if (validUserId) {
      console.log('[EcommerceVideoPage] 获取到有效的用户ID:', validUserId);
      setUserId(validUserId);
    } else {
      console.warn('[EcommerceVideoPage] 未获取到有效的用户ID，某些功能可能受限');
      setUserId('');
    }
  }, []);
  
  // 简化的素材和信息（只需产品图 + 名称 + 卖点）
  const [productImages, setProductImages] = useState<string[]>([]); // 产品图片URL列表
  const [productName, setProductName] = useState<string>(''); // 产品名称
  const [sellingPoints, setSellingPoints] = useState<string>(''); // 核心卖点
  const [category, setCategory] = useState<ProductCategory>('通用'); // 产品品类
  const [duration, setDuration] = useState<VideoDuration>(10); // 视频时长
  
  // SORA2提示词（大模型生成，用户可编辑）
  const [soraPrompt, setSoraPrompt] = useState<string>('');
  const [originalPrompt, setOriginalPrompt] = useState<string>(''); // 保存原始提示词，用于还原

  // 接收从"我有产品"传递过来的参数
  useEffect(() => {
    const state = location.state as { 
      productImages?: string[]; 
      productName?: string;
      fromMyProduct?: boolean;
      platform?: string;
    };
    
    if (state?.fromMyProduct && state?.productImages && state?.productName) {
      // 自动填充产品图片
      setProductImages(state.productImages);
      
      // 自动填充产品名称
      setProductName(state.productName);
      
      // 显示提示信息
      
      console.log('从"我有产品"跳转，产品名称:', state.productName, '图片数量:', state.productImages.length);
    }
  }, [location.state]);

  // 步骤导航
  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const goNext = async () => {
    if (currentStep < 4) {
      // 如果即将进入步骤4（生成视频），检查使用次数
      if (currentStep === 3) {
        if (!userId || !isValidUUID(userId)) {
          toast.error('用户信息无效，请重新登录');
          console.error('[EcommerceVideoPage] userId无效:', userId);
          return;
        }

        try {
          const result = await checkAndConsumeUsage(userId, 'ecommerce_video');
          
          if (!result.success) {
            toast.error(result.message);
            return;
          }

          // 显示消费信息
          if (result.consumed_type === 'free') {
            toast.success(`✅ 使用成功！本月剩余免费次数：${result.remaining_free}次`);
          } else if (result.consumed_type === 'credits') {
            toast.success(`✅ 使用成功！消费20算力，剩余算力：${result.credits_balance}`);
          }
          
          // 刷新使用次数显示
          setUsageRefreshKey(prev => prev + 1);
        } catch (error) {
          console.error('检查使用次数失败:', error);
          toast.error('系统错误，请稍后重试');
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

  // 处理提示词生成
  const handlePromptGenerated = (prompt: string) => {
    setSoraPrompt(prompt);
    setOriginalPrompt(prompt); // 保存原始版本
  };

  // 重置所有状态，创建新视频
  const handleReset = () => {
    setCurrentStep(1);
    setProductImages([]);
    setProductName('');
    setSellingPoints('');
    setCategory('通用');
    setDuration(10);
    setSoraPrompt('');
    setOriginalPrompt('');
    
  };

  // 验证当前步骤是否可以继续
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // 步骤1：需要至少1张产品图 + 产品名称 + 核心卖点
        return productImages.length > 0 && productName.trim() !== '' && sellingPoints.trim() !== '';
      case 2:
        // 步骤2：需要生成了提示词
        return soraPrompt.trim() !== '';
      case 3:
        // 步骤3：提示词已编辑确认
        return soraPrompt.trim() !== '';
      case 4:
        // 步骤4：始终可以操作
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 头部Banner - 花哨渐变风格 */}
      <div className="relative overflow-hidden bg-gradient-cyan-blue text-white px-6 py-10 shadow-heavy">
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-neon-pink/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-green/30 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/30 backdrop-blur-md flex items-center justify-center shadow-neon animate-pulse-scale">
                <Video className="w-9 h-9 animate-bounce-soft" />
              </div>
              <div>
                <h1 className="text-3xl font-black drop-shadow-lg">电商视频专区</h1>
                <p className="text-base font-bold mt-1 drop-shadow-md">
                  智能生成带货短视频，支持台词自定义编辑
                </p>
              </div>
            </div>
            
            {/* 醒目的次数显示 */}
            <UsageDisplay 
              userId={userId}
              feature="ecommerce_video"
              onRefresh={usageRefreshKey}
            />
          </div>
        </div>
        
        {/* 装饰性图形 */}
        <div className="absolute top-4 right-8 w-10 h-10 border-4 border-white/40 rounded-full animate-spin-slow" />
        <div className="absolute bottom-6 left-12 w-6 h-6 bg-white/30 rotate-45 animate-wiggle" />
      </div>

      <div className="container mx-auto p-4 xl:p-6 max-w-7xl">
        {/* 步骤指示器 - 花哨风格 */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 xl:gap-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => goToStep(step.id as Step)}
                    disabled={!isCompleted && !isActive}
                    className={`flex items-center gap-2 xl:gap-3 p-3 xl:p-4 rounded-2xl border-2 transition-all w-full shadow-lg ${
                      isActive
                        ? 'border-gold bg-gradient-purple-blue text-white shadow-colorful scale-105'
                        : isCompleted
                        ? 'border-success bg-gradient-green-yellow text-white shadow-neon hover:scale-105'
                        : 'border-border bg-muted opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 xl:w-12 xl:h-12 rounded-full flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/30 text-white animate-pulse-scale'
                          : isCompleted
                          ? 'bg-white/30 text-white'
                          : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5 xl:w-6 xl:h-6" />
                    </div>
                    <div className="text-left hidden xl:block">
                      <div className={`font-black text-sm ${isActive || isCompleted ? 'text-white' : ''}`}>
                        {step.name}
                      </div>
                      <div className={`text-xs font-bold ${isActive || isCompleted ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {step.description}
                      </div>
                    </div>
                    <div className="text-left xl:hidden">
                      <div className={`font-black text-xs ${isActive || isCompleted ? 'text-white' : ''}`}>
                        {step.name}
                      </div>
                    </div>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`hidden xl:block w-8 h-1 rounded-full mx-2 ${
                      isCompleted ? 'bg-gradient-green-yellow shadow-neon' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      {/* 内容区域 */}
      <div className="mb-6">
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
            onBack={goPrev}
            onReset={handleReset}
          />
        )}
      </div>
      </div>
    </div>
  );
}
