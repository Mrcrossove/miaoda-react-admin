import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import ThemeInputStep from '@/components/image-factory/ThemeInputStep';
import ContentGenerationStep from '@/components/image-factory/ContentGenerationStep';
import ImageSelectionStep from '@/components/image-factory/ImageSelectionStep';
import LayoutPreviewStep from '@/components/image-factory/LayoutPreviewStep';
import UsageDisplay from '@/components/UsageDisplay';
import { checkAndConsumeUsage } from '@/db/api';
import { getUserIdFromStorage, isValidUUID } from '@/utils/uuid';

// 内容项接口
export interface ContentItem {
  subTitle: string;    // 小标题
  content: string;     // 文案（50字以内）
  imageUrl?: string;   // 图片URL（AI生成或用户上传）
  imageType?: 'ai' | 'upload'; // 图片来源类型
}

// 文案风格类型
export type ContentStyle = 'science' | 'recommend' | 'cute';

export default function ImageFactoryPage() {
  const location = useLocation();
  
  // 当前步骤（1-4）
  const [currentStep, setCurrentStep] = useState(1);
  
  // 使用次数刷新计数器
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  
  // 获取用户ID
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    const validUserId = getUserIdFromStorage();
    if (validUserId) {
      console.log('[ImageFactoryPage] 获取到有效的用户ID:', validUserId);
      setUserId(validUserId);
    } else {
      console.warn('[ImageFactoryPage] 未获取到有效的用户ID，某些功能可能受限');
      setUserId('');
    }
  }, []);

  // 步骤1：主题输入与参数配置
  const [theme, setTheme] = useState<string>('');           // 核心主题
  const [itemCount, setItemCount] = useState<number>(3);    // 图片数量（1-3）
  const [contentStyle, setContentStyle] = useState<ContentStyle>('science'); // 文案风格
  const [backgroundImage, setBackgroundImage] = useState<string>(''); // 背景图
  const [backgroundType, setBackgroundType] = useState<'template' | 'upload'>('template'); // 背景类型

  // 步骤2：AI生成的内容
  const [contentList, setContentList] = useState<ContentItem[]>([]);

  // 步骤3：图片选择完成的内容
  const [finalContentList, setFinalContentList] = useState<ContentItem[]>([]);

  // 接收从"我有产品"传递过来的参数
  useEffect(() => {
    const state = location.state as { 
      coreTheme?: string; 
      fromMyProduct?: boolean;
      platform?: string;
    };
    
    if (state?.coreTheme && state?.fromMyProduct) {
      setTheme(state.coreTheme);
      
      // 显示提示信息
      
      console.log('从"我有产品"跳转，核心主题:', state.coreTheme);
    }
  }, [location.state]);

  // 步骤导航
  const goNext = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const goPrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // 处理主题输入完成
  const handleThemeConfirmed = async (
    newTheme: string,
    newItemCount: number,
    newContentStyle: ContentStyle,
    newBackgroundImage: string,
    newBackgroundType: 'template' | 'upload'
  ) => {
    // 检查并消费使用次数
    if (!userId || !isValidUUID(userId)) {
      toast.error('用户信息无效，请重新登录');
      console.error('[ImageFactoryPage] userId无效:', userId);
      return;
    }

    try {
      const result = await checkAndConsumeUsage(userId, 'image_factory');
      
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      // 显示消费信息
      if (result.consumed_type === 'free') {
        toast.success(`✅ 使用成功！本月剩余免费次数：${result.remaining_free}次`);
      } else if (result.consumed_type === 'credits') {
        toast.success(`✅ 使用成功！消费10算力，剩余算力：${result.credits_balance}`);
      }

      // 刷新使用次数显示
      setUsageRefreshKey(prev => prev + 1);

      setTheme(newTheme);
      setItemCount(newItemCount);
      setContentStyle(newContentStyle);
      setBackgroundImage(newBackgroundImage);
      setBackgroundType(newBackgroundType);
      goNext();
    } catch (error) {
      console.error('检查使用次数失败:', error);
      toast.error('系统错误，请稍后重试');
    }
  };

  // 处理内容生成完成
  const handleContentGenerated = (list: ContentItem[]) => {
    setContentList(list);
    goNext();
  };

  // 处理图片选择完成
  const handleImageSelectionCompleted = (list: ContentItem[]) => {
    setFinalContentList(list);
    goNext();
  };

  // 重置所有状态
  const handleReset = () => {
    setCurrentStep(1);
    setTheme('');
    setItemCount(5);
    setContentStyle('science');
    setBackgroundImage('');
    setBackgroundType('template');
    setContentList([]);
    setFinalContentList([]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 头部Banner - 花哨渐变风格 */}
      <div className="relative overflow-hidden bg-gradient-pink-orange text-white px-6 py-10 shadow-heavy">
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-neon-yellow/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-cyan/30 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/30 backdrop-blur-md flex items-center justify-center shadow-neon animate-pulse-scale">
                <ImageIcon className="w-9 h-9 animate-bounce-soft" />
              </div>
              <div>
                <h1 className="text-3xl font-black drop-shadow-lg">图片工厂</h1>
                <p className="text-base font-bold mt-1 drop-shadow-md">
                  AI智能生成小红薯风格配图，一键导出高清图片
                </p>
              </div>
            </div>
            
            {/* 醒目的次数显示 */}
            <UsageDisplay 
              userId={userId}
              feature="image_factory"
              onRefresh={usageRefreshKey}
            />
          </div>
        </div>
        
        {/* 装饰性图形 */}
        <div className="absolute top-4 right-8 w-10 h-10 border-4 border-white/40 rounded-full animate-spin-slow" />
        <div className="absolute bottom-6 left-12 w-6 h-6 bg-white/30 rotate-45 animate-wiggle" />
      </div>

      <div className="container mx-auto p-4 xl:p-6 max-w-4xl">
        {/* 步骤指示器 - 花哨风格 */}
        <Card className="mb-6 shadow-heavy border-2 border-transparent hover:border-gold transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: '主题配置', icon: '🎨' },
                { step: 2, label: 'AI生成', icon: '✨' },
                { step: 3, label: '图片选择', icon: '🖼️' },
                { step: 4, label: '排版导出', icon: '📤' },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-black transition-all shadow-lg ${
                        currentStep >= item.step
                          ? 'bg-gradient-purple-blue text-white shadow-colorful scale-110'
                          : 'bg-muted text-muted-foreground'
                      } ${currentStep === item.step ? 'animate-pulse-scale' : ''}`}
                    >
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <span
                      className={`text-xs mt-2 font-bold ${
                        currentStep >= item.step ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all rounded-full ${
                        currentStep > item.step ? 'bg-gradient-purple-blue shadow-colorful' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 步骤内容 */}
        <div>
        {/* 步骤1：主题输入与参数配置 */}
        {currentStep === 1 && (
          <ThemeInputStep
            theme={theme}
            itemCount={itemCount}
            contentStyle={contentStyle}
            backgroundImage={backgroundImage}
            backgroundType={backgroundType}
            onThemeChange={setTheme}
            onItemCountChange={setItemCount}
            onContentStyleChange={setContentStyle}
            onBackgroundImageChange={setBackgroundImage}
            onBackgroundTypeChange={setBackgroundType}
            onConfirm={handleThemeConfirmed}
          />
        )}

        {/* 步骤2：AI自动生成内容 */}
        {currentStep === 2 && (
          <ContentGenerationStep
            theme={theme}
            itemCount={itemCount}
            contentStyle={contentStyle}
            onContentGenerated={handleContentGenerated}
            onBack={goPrev}
          />
        )}

        {/* 步骤3：图片与背景选择 */}
        {currentStep === 3 && (
          <ImageSelectionStep
            theme={theme}
            contentList={contentList}
            onCompleted={handleImageSelectionCompleted}
            onBack={goPrev}
          />
        )}

        {/* 步骤4：自动排版与导出 */}
        {currentStep === 4 && (
          <LayoutPreviewStep
            theme={theme}
            backgroundImage={backgroundImage}
            contentList={finalContentList}
            onBack={goPrev}
            onReset={handleReset}
          />
        )}
      </div>
      </div>
    </div>
  );
}
