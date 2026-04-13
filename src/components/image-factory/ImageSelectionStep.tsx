import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Image as ImageIcon, Upload, Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { generateImageWithDashscope, generateImagePrompt } from '@/db/selfHostedApi';
import type { ContentItem } from '@/pages/ImageFactoryPage';

interface ImageSelectionStepProps {
  theme: string;
  contentList: ContentItem[];
  onCompleted: (list: ContentItem[]) => void;
  onBack: () => void;
}

export default function ImageSelectionStep({
  theme,
  contentList,
  onCompleted,
  onBack,
}: ImageSelectionStepProps) {
  const [items, setItems] = useState<ContentItem[]>(
    contentList.map(item => ({ ...item, imageUrl: '', imageType: undefined }))
  );
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  // AI生成图片
  const handleAIGenerate = async (index: number) => {
    setGeneratingIndex(index);

    try {
      // 获取当前项的内容
      const currentItem = items[index];
      
      if (!currentItem) {
        throw new Error('无法获取当前项');
      }

      // 步骤1：生成图片提示词
      console.log(`生成第${index + 1}张图片的提示词...`);
      const prompt = await generateImagePrompt(theme, currentItem.subTitle, currentItem.content);
      console.log(`第${index + 1}张图片提示词:`, prompt);

      // 步骤2：使用提示词生成图片
      console.log(`使用提示词生成第${index + 1}张图片...`);
      const imageUrl = await generateImageWithDashscope(prompt, '1024*1024');
      console.log(`第${index + 1}张图片生成成功:`, imageUrl);

      // 更新图片URL（使用函数式更新确保基于最新状态）
      setItems(prevItems => {
        const newItems = [...prevItems];
        newItems[index] = {
          ...newItems[index],
          imageUrl,
          imageType: 'ai',
        };
        return newItems;
      });
      
    } catch (error: any) {
      console.error(`第${index + 1}张图片生成失败:`, error);
      toast.error(error?.message || `第 ${index + 1} 张图片生成失败`);
    } finally {
      setGeneratingIndex(null);
    }
  };

  // 用户上传图片
  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    // 读取文件并预览
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      
      // 使用函数式更新确保基于最新状态
      setItems(prevItems => {
        const newItems = [...prevItems];
        newItems[index] = {
          ...newItems[index],
          imageUrl,
          imageType: 'upload',
        };
        return newItems;
      });
      
    };
    reader.readAsDataURL(file);
  };

  // 批量AI生成
  const handleBatchGenerate = async () => {
    // 获取需要生成图片的索引列表
    const indicesToGenerate: number[] = [];
    setItems(prevItems => {
      prevItems.forEach((item, index) => {
        if (!item.imageUrl) {
          indicesToGenerate.push(index);
        }
      });
      return prevItems;
    });

    // 如果没有需要生成的图片，提示用户
    if (indicesToGenerate.length === 0) {
      toast.info('所有图片都已生成');
      return;
    }

    toast.info(`开始批量生成 ${indicesToGenerate.length} 张图片...`);

    // 顺序生成每张图片
    for (const index of indicesToGenerate) {
      await handleAIGenerate(index);
      // 等待1秒，避免API请求过快
      if (index !== indicesToGenerate[indicesToGenerate.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    
  };

  // 确认并进入下一步
  const handleConfirm = () => {
    // 检查是否所有图片都已选择
    const missingImages = items.filter(item => !item.imageUrl);
    if (missingImages.length > 0) {
      toast.error(`还有 ${missingImages.length} 张图片未选择`);
      return;
    }

    onCompleted(items);
  };

  // 计算进度
  const completedCount = items.filter(item => item.imageUrl).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="space-y-6">
      {/* 进度提示 */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">图片选择进度</h3>
            </div>
            <span className="text-sm font-medium text-primary">
              {completedCount} / {items.length}
            </span>
          </div>
          
          {/* 进度条 */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 批量生成按钮 */}
          {completedCount < items.length && (
            <div className="mt-4">
              <Button
                onClick={handleBatchGenerate}
                disabled={generatingIndex !== null}
                className="w-full"
              >
                {generatingIndex !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    正在生成...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    一键AI生成所有图片
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 图片选择列表 */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* 序号 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  item.imageUrl ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {item.imageUrl ? <Check className="w-5 h-5" /> : index + 1}
                </div>

                {/* 内容 */}
                <div className="flex-1 space-y-4">
                  {/* 小标题和文案 */}
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{item.subTitle}</h4>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                  </div>

                  {/* 图片选择 */}
                  <Tabs defaultValue="ai" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="ai">
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI生图
                      </TabsTrigger>
                      <TabsTrigger value="upload">
                        <Upload className="w-4 h-4 mr-2" />
                        上传图片
                      </TabsTrigger>
                    </TabsList>

                    {/* AI生图 */}
                    <TabsContent value="ai" className="space-y-3">
                      {item.imageUrl && item.imageType === 'ai' ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500">
                          <img
                            src={item.imageUrl}
                            alt={item.subTitle}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            AI生成
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAIGenerate(index)}
                          disabled={generatingIndex !== null}
                          className="w-full"
                          variant="outline"
                        >
                          {generatingIndex === index ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              AI生成图片
                            </>
                          )}
                        </Button>
                      )}
                    </TabsContent>

                    {/* 上传图片 */}
                    <TabsContent value="upload" className="space-y-3">
                      {item.imageUrl && item.imageType === 'upload' ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-500">
                          <img
                            src={item.imageUrl}
                            alt={item.subTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            已上传
                          </div>
                        </div>
                      ) : (
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(index, e)}
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">点击上传图片</span>
                          </div>
                        </label>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={generatingIndex !== null}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </Button>

        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={completedCount < items.length || generatingIndex !== null}
          className="px-8"
        >
          下一步：排版导出
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
