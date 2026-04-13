import { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download, ArrowLeft, RotateCcw, Loader2, Package, Share2, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import type { ContentItem } from '@/pages/ImageFactoryPage';
import { generateImageFactoryCaption } from '@/db/selfHostedApi';
import { useXHSShare } from '@/hooks/useXHSShare';
import { uploadImagesToSupabase } from '@/services/imageUploadService';
import { filterContentLabels } from '@/utils/contentFilter';

interface LayoutPreviewStepProps {
  theme: string;
  backgroundImage: string;
  contentList: ContentItem[];
  onBack: () => void;
  onReset: () => void;
}

export default function LayoutPreviewStep({
  theme,
  backgroundImage,
  contentList,
  onBack,
  onReset,
}: LayoutPreviewStepProps) {
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const [rendering, setRendering] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [title, setTitle] = useState<string>(''); // 笔记标题
  const [caption, setCaption] = useState<string>(''); // 文案内容
  const [generatingCaption, setGeneratingCaption] = useState(false); // AI生成文案状态
  const [uploading, setUploading] = useState(false); // 上传图片状态
  
  // 使用小红书JS SDK发布Hook
  const { shareToXhs, isReady: sdkReady } = useXHSShare();

  // 渲染所有画布
  useEffect(() => {
    renderAllCanvas();
  }, [theme, backgroundImage, contentList]);

  // 渲染所有Canvas（每个小标题对应一张图）
  const renderAllCanvas = async () => {
    setRendering(true);

    try {
      const urls: string[] = [];

      // 为每个contentItem生成一张图片
      for (let i = 0; i < contentList.length; i++) {
        const canvas = canvasRefs.current[i];
        if (!canvas) continue;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法获取Canvas上下文');

        // 设置画布尺寸（小红书标准尺寸）
        const width = 1080;
        const height = 1920;
        canvas.width = width;
        canvas.height = height;

        // 绘制背景
        await drawBackground(ctx, width, height);

        // 绘制主题标题（顶部）
        drawMainTitle(ctx, width, theme);

        // 绘制内容项（小标题 + 图片 + 文案）
        await drawContentItem(ctx, width, height, contentList[i], i + 1);

        // 生成预览URL
        const url = canvas.toDataURL('image/png');
        urls.push(url);
      }

      setPreviewUrls(urls);
    } catch (error) {
      console.error('渲染失败:', error);
      toast.error('画布渲染失败');
    } finally {
      setRendering(false);
    }
  };

  // 绘制背景
  const drawBackground = async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = () => {
        // 如果背景加载失败，使用纯色背景
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(0, 0, width, height);
        resolve();
      };
      img.src = backgroundImage;
    });
  };

  // 绘制主题标题（顶部）
  const drawMainTitle = (ctx: CanvasRenderingContext2D, width: number, title: string) => {
    const y = 120;

    // 绘制标题文字（与文案相同的颜色，加粗）
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, width / 2, y);
  };

  // 绘制单个内容项（小标题 + 图片 + 文案）
  const drawContentItem = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    item: ContentItem,
    index: number
  ) => {
    const startY = 300;
    const imageSize = 600;

    // 绘制小标题（与文案相同的颜色，加粗）
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.subTitle, width / 2, startY + 60);

    // 绘制图片
    if (item.imageUrl) {
      await drawImage(ctx, item.imageUrl, width / 2 - imageSize / 2, startY + 150, imageSize, imageSize);
    }

    // 绘制文案
    ctx.fillStyle = '#333333';
    ctx.font = '40px Arial, sans-serif';
    ctx.textAlign = 'center';
    const textY = startY + 150 + imageSize + 80;
    wrapText(ctx, item.content, width / 2, textY, width - 120, 60);
  };

  // 绘制图片
  const drawImage = (
    ctx: CanvasRenderingContext2D,
    src: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // 绘制阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        // 绘制圆角矩形
        ctx.save();
        roundRect(ctx, x, y, width, height, 20);
        ctx.clip();
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        resolve();
      };
      img.onerror = () => {
        // 如果图片加载失败，绘制占位符
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(x, y, width, height);
        resolve();
      };
      img.src = src;
    });
  };

  // 绘制圆角矩形路径
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // 文字换行
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split('');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  // 下载单张图片
  const handleDownloadSingle = (index: number) => {
    if (!previewUrls[index]) {
      toast.error('请等待画布渲染完成');
      return;
    }

    const link = document.createElement('a');
    link.download = `${theme}-${index + 1}-${contentList[index].subTitle}.png`;
    link.href = previewUrls[index];
    link.click();
    // 删除下载成功提示
  };

  // 下载所有图片（移动端网页版本）
  const handleDownloadAll = async () => {
    if (previewUrls.length === 0) {
      toast.error('请等待画布渲染完成');
      return;
    }

    setDownloading(true);

    try {
      // 移动端网页：一张张下载
      for (let i = 0; i < previewUrls.length; i++) {
        const link = document.createElement('a');
        link.download = `${theme}-${i + 1}-${contentList[i].subTitle}.png`;
        link.href = previewUrls[i];
        link.click();
        
        // 延迟一下，避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      toast.success(`已下载 ${previewUrls.length} 张图片`);
    } catch (error) {
      console.error('下载图片失败:', error);
      toast.error('下载图片失败');
    } finally {
      setDownloading(false);
    }
  };

  // 复制文案到剪贴板
  const handleCopyCaption = async () => {
    if (!caption.trim()) {
      toast.error('请先输入文案');
      return;
    }

    try {
      await navigator.clipboard.writeText(caption);
      // 删除复制成功提示
    } catch (error) {
      console.error('复制失败:', error);
      toast.error('复制失败，请手动复制');
    }
  };

  // AI生成文案
  const handleGenerateCaption = async () => {
    if (!theme) {
      toast.error('主题词为空，无法生成文案');
      return;
    }

    setGeneratingCaption(true);

    try {
      const generatedCaption = await generateImageFactoryCaption(theme);
      // 应用AI文案内容过滤系统，移除【标题】、【正文】等标识
      const filteredCaption = filterContentLabels(generatedCaption);
      setCaption(filteredCaption);
      // 删除生成成功提示
    } catch (error) {
      console.error('生成文案失败:', error);
      toast.error('生成文案失败，请重试');
    } finally {
      setGeneratingCaption(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 预览区域 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">预览效果（共 {contentList.length} 张）</h3>
            {rendering && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                渲染中...
              </div>
            )}
          </div>

          {/* Canvas画布（隐藏） */}
          {contentList.map((_, index) => (
            <canvas
              key={index}
              ref={(el) => {
                if (el) canvasRefs.current[index] = el;
              }}
              className="hidden"
            />
          ))}

          {/* 预览图片网格 */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative aspect-[9/16] rounded-lg overflow-hidden border-2 border-border shadow-lg">
                    <img
                      src={url}
                      alt={`预览 ${index + 1}`}
                      className="w-full h-full object-contain bg-white"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}/{contentList.length}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadSingle(index)}
                    className="w-full"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    下载第 {index + 1} 张
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <p className="text-sm text-green-700">
            ✅ 已生成 {contentList.length} 张图片！可以单独下载或一键保存全部到相册
          </p>
        </CardContent>
      </Card>

      {/* 文案编辑区域 */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">配上文案，一键发布</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateCaption}
                disabled={generatingCaption || !theme}
              >
                {generatingCaption ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI写文案
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCaption}
                disabled={!caption.trim()}
              >
                <Copy className="w-4 h-4 mr-2" />
                复制文案
              </Button>
            </div>
          </div>

          {/* 笔记标题（可选） */}
          <div className="space-y-2">
            <Label htmlFor="title">笔记标题（可选）</Label>
            <Input
              id="title"
              placeholder="输入笔记标题，将尝试自动填充到小红书..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/30 字 · 提示：标题会尝试自动填充，但小红书可能不支持
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">小红书文案（不超过50字）</Label>
            <Textarea
              id="caption"
              placeholder="点击「AI写文案」自动生成，或手动输入...&#10;例如：&#10;✨ 今天分享超实用的技巧！#生活小妙招 #干货分享"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              maxLength={50}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {caption.length}/50 字 · 提示：点击「AI写文案」根据主题词「{theme}」自动生成
            </p>
          </div>

          {/* 小红书JS SDK发布按钮 */}
          <Button
            size="lg"
            className="w-full"
            disabled={uploading || rendering || !sdkReady}
            onClick={async () => {
              // 前置校验
              if (!caption.trim()) {
                toast.error('请先输入或生成文案');
                return;
              }
              if (previewUrls.length === 0) {
                toast.error('请等待图片渲染完成');
                return;
              }

              try {
                setUploading(true);

                // 1. 上传图片到Supabase获取公网URL
                toast.info('正在上传图片...');
                const imagesToUpload = previewUrls.map((url, index) => ({
                  url,
                  filename: `${theme}-${index + 1}-${contentList[index].subTitle}.png`,
                }));

                const publicUrls = await uploadImagesToSupabase(
                  imagesToUpload,
                  (current, total) => {
                    console.log(`上传进度: ${current}/${total}`);
                  }
                );

                if (publicUrls.length === 0) {
                  toast.error('图片上传失败，请重试');
                  return;
                }

                // 2. 调用小红书JS SDK分享
                await shareToXhs({
                  type: 'normal', // 图文类型
                  title: title.trim() || theme, // 使用标题或主题作为标题
                  content: caption,
                  images: publicUrls,
                  fail: (err) => {
                    console.error('分享失败:', err);
                  },
                });
              } catch (error) {
                console.error('发布异常:', error);
                toast.error('发布失败，请重试');
              } finally {
                setUploading(false);
              }
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="ml-2">上传中...</span>
              </>
            ) : !sdkReady ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="ml-2">SDK初始化中...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="ml-2">一键发布到小红书</span>
              </>
            )}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <p className="text-xs text-blue-700">
              💡 <strong>JS SDK发布流程</strong>：<br />
              1️⃣ 自动上传图片到云端<br />
              2️⃣ 自动唤起小红书APP<br />
              3️⃣ 自动填充标题、文案和图片<br />
              4️⃣ 您只需在小红书中点击「发布」即可
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重新开始
          </Button>

          <Button
            size="lg"
            onClick={handleDownloadAll}
            disabled={previewUrls.length === 0 || rendering || downloading}
            className="px-8"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                保存全部到相册
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
