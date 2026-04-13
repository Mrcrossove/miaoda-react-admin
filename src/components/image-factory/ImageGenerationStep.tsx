import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { generateImageWithDashscope } from '@/db/selfHostedApi';
import { compositeImage, downloadImage } from '@/utils/imageComposite';

interface ContentItem {
  sub_title: string;
  content: string;
}

interface GeneratedImage {
  id: string;
  subTitle: string;
  content: string;
  generatedImageUrl: string; // 生成的配图URL
  compositeImageUrl: string; // 合成后的图片URL
  status: 'pending' | 'generating' | 'compositing' | 'completed' | 'failed';
  error?: string;
}

interface ImageGenerationStepProps {
  backgroundImage: string;
  mainTitle: string;
  contentList: ContentItem[];
  onBack: () => void;
  onReset: () => void;
}

export default function ImageGenerationStep({
  backgroundImage,
  mainTitle,
  contentList,
  onBack,
  onReset,
}: ImageGenerationStepProps) {
  const [images, setImages] = useState<GeneratedImage[]>(
    contentList.map((item, index) => ({
      id: `img-${index}`,
      subTitle: item.sub_title,
      content: item.content,
      generatedImageUrl: '',
      compositeImageUrl: '',
      status: 'pending',
    }))
  );
  const [overallStatus, setOverallStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');

  // 生成单张图片的提示词
  const generatePrompt = (subTitle: string, content: string): string => {
    // 构造小红书风格的图片提示词
    return `小红书风格配图，主题：${subTitle}。${content.replace(/[😊💕✨🌟💖🎉👍🔥💪🌸🎨📸等emoji]/g, '')}。要求：简约清新，色彩明亮，适合社交媒体分享，高质量，专业摄影。`;
  };

  // 开始生成
  const handleStartGeneration = async () => {
    setOverallStatus('generating');
    toast.info('开始生成配图...');

    for (let i = 0; i < images.length; i++) {
      const item = images[i];

      try {
        // 更新状态为生成中
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i ? { ...img, status: 'generating' as const } : img
          )
        );

        // 生成提示词
        const prompt = generatePrompt(item.subTitle, item.content);
        console.log(`生成第${i + 1}张图片，提示词:`, prompt);

        // 调用生图API（size格式：宽*高）
        const generatedImageUrl = await generateImageWithDashscope(prompt, '1024*1024');
        console.log(`第${i + 1}张图片生成成功:`, generatedImageUrl);

        // 更新状态为合成中
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i
              ? { ...img, generatedImageUrl, status: 'compositing' as const }
              : img
          )
        );

        // 合成图片
        const compositeImageUrl = await compositeImage({
          backgroundImage,
          generatedImage: generatedImageUrl,
          mainTitle,
          subTitle: item.subTitle,
          content: item.content,
        });
        console.log(`第${i + 1}张图片合成成功`);

        // 更新状态为完成
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i
              ? { ...img, compositeImageUrl, status: 'completed' as const }
              : img
          )
        );

      } catch (error) {
        console.error(`第${i + 1}张图片生成失败:`, error);
        
        // 更新状态为失败
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i
              ? {
                  ...img,
                  status: 'failed' as const,
                  error: error instanceof Error ? error.message : '生成失败',
                }
              : img
          )
        );

        toast.error(`第${i + 1}张图片生成失败`);
      }
    }

    // 检查是否全部完成
    const allCompleted = images.every((img) => img.status === 'completed' || img.status === 'failed');
    if (allCompleted) {
      const successCount = images.filter((img) => img.status === 'completed').length;
      if (successCount > 0) {
        setOverallStatus('completed');
      } else {
        setOverallStatus('failed');
        toast.error('所有配图生成失败');
      }
    }
  };

  // 下载单张图片
  const handleDownloadSingle = (image: GeneratedImage) => {
    if (!image.compositeImageUrl) return;
    
    const filename = `${mainTitle}-${image.subTitle}.png`;
    downloadImage(image.compositeImageUrl, filename);
  };

  // 批量下载
  const handleDownloadAll = () => {
    const completedImages = images.filter((img) => img.status === 'completed');
    if (completedImages.length === 0) {
      toast.error('没有可下载的图片');
      return;
    }

    // 逐个下载
    completedImages.forEach((img, index) => {
      setTimeout(() => {
        handleDownloadSingle(img);
      }, index * 500); // 间隔500ms下载
    });

  };

  // 重新生成
  const handleRegenerate = () => {
    setImages(
      contentList.map((item, index) => ({
        id: `img-${index}`,
        subTitle: item.sub_title,
        content: item.content,
        generatedImageUrl: '',
        compositeImageUrl: '',
        status: 'pending',
      }))
    );
    setOverallStatus('idle');
  };

  return (
    <div className="space-y-6">
      {/* 提示信息 */}
      {overallStatus === 'idle' && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ImageIcon className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <p className="font-medium mb-1">准备生成配图</p>
                <p className="text-purple-700">
                  将为{contentList.length}个分标题生成小红书风格配图（1080×1920）
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 生成进度 */}
      {overallStatus === 'generating' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-semibold mb-1">正在生成配图...</p>
                <p className="text-sm text-muted-foreground">
                  已完成 {images.filter((img) => img.status === 'completed').length} /{' '}
                  {images.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图片列表 */}
      <div className="space-y-4">
        {images.map((image, index) => (
          <Card key={image.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* 序号 */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>

                {/* 内容 */}
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold">{image.subTitle}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {image.content}
                  </p>

                  {/* 状态 */}
                  <div className="flex items-center gap-2">
                    {image.status === 'pending' && (
                      <span className="text-xs text-muted-foreground">等待生成</span>
                    )}
                    {image.status === 'generating' && (
                      <>
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        <span className="text-xs text-primary">生成配图中...</span>
                      </>
                    )}
                    {image.status === 'compositing' && (
                      <>
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        <span className="text-xs text-blue-600">合成图片中...</span>
                      </>
                    )}
                    {image.status === 'completed' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600">生成完成</span>
                      </>
                    )}
                    {image.status === 'failed' && (
                      <span className="text-xs text-red-600">生成失败：{image.error}</span>
                    )}
                  </div>

                  {/* 预览图 */}
                  {image.status === 'completed' && image.compositeImageUrl && (
                    <div className="mt-3">
                      <img
                        src={image.compositeImageUrl}
                        alt={image.subTitle}
                        className="w-full max-w-xs rounded-lg border"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => handleDownloadSingle(image)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-3">
        {overallStatus === 'idle' && (
          <>
            <Button onClick={handleStartGeneration} size="lg" className="w-full">
              开始生成配图
            </Button>
            <Button onClick={onBack} variant="outline" className="w-full">
              上一步
            </Button>
          </>
        )}

        {overallStatus === 'completed' && (
          <>
            <Button onClick={handleDownloadAll} size="lg" className="w-full">
              <Download className="w-5 h-5 mr-2" />
              批量下载全部图片
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleRegenerate} variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                重新生成
              </Button>
              <Button onClick={onReset} variant="outline">
                创建新任务
              </Button>
            </div>
          </>
        )}

        {overallStatus === 'generating' && (
          <Button onClick={onBack} variant="outline" disabled className="w-full">
            生成中，请稍候...
          </Button>
        )}
      </div>
    </div>
  );
}
