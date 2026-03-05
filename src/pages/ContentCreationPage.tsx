import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Link as LinkIcon, Sparkles, Upload, Download, ExternalLink, Loader2, Image as ImageIcon, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseXiaohongshuNote, submitImageToImage, queryImageToImage, uploadImage } from '@/db/api';
import { sendStreamRequest } from '@/utils/stream';
import { Skeleton } from '@/components/ui/skeleton';
import { useXHSShare } from '@/hooks/useXHSShare';
import { compressImage } from '@/utils/imageCompress';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function ContentCreationPage() {
  const location = useLocation();
  const platform = (location.state as { platform?: string })?.platform || '小红薯';
  
  const [noteUrl, setNoteUrl] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [optimizedContent, setOptimizedContent] = useState('');
  const [noteTitle, setNoteTitle] = useState(''); // 笔记标题
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToImageTasks, setImageToImageTasks] = useState<Map<string, { status: string; imageUrl?: string }>>(new Map());
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 小红书分享Hook
  const { shareToXhs } = useXHSShare();

  // 解析小红薯链接
  const handleParse = async () => {
    if (!noteUrl.trim()) {
      toast.error('请输入小红薯笔记链接');
      return;
    }

    setIsParsing(true);
    try {
      console.log('开始解析链接:', noteUrl);
      const result = await parseXiaohongshuNote(noteUrl.trim());
      
      console.log('解析结果:', result);
      
      if (result?.success && result?.data?.content) {
        setOriginalContent(result.data.content);
        
      } else {
        toast.error('解析失败，请检查链接是否正确');
      }
    } catch (error: any) {
      console.error('解析失败:', error);
      toast.error(error?.message || '解析失败，请稍后重试');
    } finally {
      setIsParsing(false);
    }
  };

  // 优化文案
  const handleOptimize = async () => {
    if (!originalContent.trim()) {
      toast.error('请先解析小红薯链接或输入原始内容');
      return;
    }

    setIsOptimizing(true);
    setOptimizedContent('');
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      await sendStreamRequest({
        functionUrl: `${supabaseUrl}/functions/v1/optimize-xiaohongshu-copy`,
        requestBody: { originalContent },
        supabaseAnonKey,
        onData: (data) => {
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.content || '';
            setOptimizedContent(prev => prev + chunk);
          } catch (e) {
            console.warn('解析数据失败:', e);
          }
        },
        onComplete: () => {
          setIsOptimizing(false);
          
        },
        onError: (error) => {
          console.error('优化失败:', error);
          setIsOptimizing(false);
          toast.error('优化失败，请稍后重试');
        },
        signal: abortControllerRef.current.signal,
      });
    } catch (error: any) {
      console.error('优化失败:', error);
      setIsOptimizing(false);
      toast.error(error?.message || '优化失败');
    }
  };

  // 停止优化
  const handleStopOptimize = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsOptimizing(false);
      toast.info('已停止优化');
    }
  };

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // 验证文件类型
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'].includes(file.type)) {
          toast.error(`${file.name} 格式不支持`);
          continue;
        }

        // 验证文件大小（最大10MB）
        const maxSizeMB = 10;
        const fileSizeMB = file.size / (1024 * 1024);
        
        if (fileSizeMB > maxSizeMB) {
          toast.error(`${file.name} 超过${maxSizeMB}MB，请选择更小的图片`);
          continue;
        }

        // 压缩图片（如果超过1MB）
        let fileToUpload = file;
        if (fileSizeMB > 1) {
          toast.info(`${file.name} 超过1MB，正在自动压缩...`);
          try {
            fileToUpload = await compressImage(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              initialQuality: 0.8,
            });
            const compressedSizeMB = fileToUpload.size / (1024 * 1024);
            toast.success(`压缩完成：${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);
          } catch (error) {
            console.error('压缩失败:', error);
            toast.error(`${file.name} 压缩失败，将使用原图上传`);
            fileToUpload = file;
          }
        }

        // 上传图片
        const imageUrl = await uploadImage(fileToUpload);
        newImages.push(imageUrl);
      }

      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages]);
        toast.success(`成功上传 ${newImages.length} 张图片`);
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      toast.error(error?.message || '上传失败');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 图生图
  const handleImageToImage = async (imageUrl: string) => {
    try {
      // 下载图片并转换为Base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]; // 移除data:image前缀
        
        // 提交图生图任务
        toast.info('正在提交图生图任务...');
        const result = await submitImageToImage(
          base64,
          blob.type,
          '将这张图片进行二创，保持主体内容不变，但改变风格和色调，使其更加吸引人，适合小红薯平台'
        );
        
        if (result?.success && result?.data?.taskId) {
          const taskId = result.data.taskId;
          
          
          // 更新任务状态
          setImageToImageTasks(prev => new Map(prev).set(taskId, { status: 'PENDING' }));
          
          // 开始轮询任务状态
          pollImageToImageTask(taskId);
        } else {
          toast.error('提交任务失败');
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error: any) {
      console.error('图生图失败:', error);
      toast.error(error?.message || '图生图失败');
    }
  };

  // 轮询图生图任务状态
  const pollImageToImageTask = async (taskId: string) => {
    const maxAttempts = 60; // 最多查询60次（10分钟）
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await queryImageToImage(taskId);
        
        if (result?.success && result?.data) {
          const { status, imageUrl, error } = result.data;
          
          // 更新任务状态
          setImageToImageTasks(prev => new Map(prev).set(taskId, { status, imageUrl }));
          
          if (status === 'SUCCESS' && imageUrl) {
            
            // 添加到上传图片列表
            setUploadedImages(prev => [...prev, imageUrl]);
            return;
          } else if (status === 'FAILED') {
            toast.error(`图片生成失败: ${error?.message || '未知错误'}`);
            return;
          } else if (status === 'PENDING' || status === 'PROCESSING') {
            attempts++;
            if (attempts < maxAttempts) {
              // 继续轮询（每10秒查询一次）
              setTimeout(poll, 10000);
            } else {
              toast.error('图片生成超时，请稍后重试');
            }
          }
        }
      } catch (error: any) {
        console.error('查询任务失败:', error);
        toast.error('查询任务失败');
      }
    };

    poll();
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    
  };

  // 复制文案
  const handleCopy = () => {
    if (!optimizedContent.trim()) {
      toast.error('没有可复制的文案');
      return;
    }

    navigator.clipboard.writeText(optimizedContent);
    
  };

  // 下载图片
  const handleDownloadImages = async () => {
    if (uploadedImages.length === 0) {
      toast.error('没有可下载的图片');
      return;
    }

    toast.info(`开始下载 ${uploadedImages.length} 张图片...`);

    for (let i = 0; i < uploadedImages.length; i++) {
      const imageUrl = uploadedImages[i];
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `image_${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`下载图片 ${i + 1} 失败:`, error);
      }
    }

    
  };

  // 发布到小红薯
  const handlePublish = async () => {
    if (!optimizedContent.trim()) {
      toast.error('请先优化文案');
      return;
    }

    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题');
      return;
    }

    if (uploadedImages.length === 0) {
      toast.error('请至少上传一张图片');
      return;
    }

    try {
      // 调用小红书JSSDK发布
      await shareToXhs({
        type: 'normal',
        title: noteTitle,
        content: optimizedContent,
        images: uploadedImages,
        fail: (error) => {
          console.error('发布失败:', error);
          toast.error('发布失败，请重试');
        }
      });
      
      toast.success('正在唤起小红书APP...');
    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败，请重试');
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-4 xl:p-6 max-w-7xl pb-24">
      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">图文创作</h1>
            <p className="text-sm text-muted-foreground">
              {platform} · 一键优化文案，智能图片二创
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左侧：输入区域 */}
        <div className="space-y-6">
          {/* 链接解析 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">步骤1：粘贴小红薯链接</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note-url">笔记链接</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="note-url"
                      placeholder="https://www.xiaohongshu.com/..."
                      value={noteUrl}
                      onChange={(e) => setNoteUrl(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleParse()}
                    />
                    <Button onClick={handleParse} disabled={isParsing}>
                      {isParsing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          解析中
                        </>
                      ) : (
                        '解析'
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="original-content">原始内容</Label>
                  <Textarea
                    id="original-content"
                    placeholder="解析后的内容将显示在这里，您也可以直接输入..."
                    value={originalContent}
                    onChange={(e) => setOriginalContent(e.target.value)}
                    rows={8}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 文案优化 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">步骤2：优化文案</h3>
              </div>
              
              <div className="flex gap-2">
                {!isOptimizing ? (
                  <Button onClick={handleOptimize} className="flex-1">
                    <Sparkles className="w-4 h-4 mr-2" />
                    一键优化
                  </Button>
                ) : (
                  <Button onClick={handleStopOptimize} variant="destructive" className="flex-1">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    停止优化
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 图片上传 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">步骤3：上传或生成图片</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        上传中
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        上传图片
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  💡 支持JPEG、PNG、GIF、WEBP格式，单张图片最大10MB（超过1MB自动压缩）
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：输出区域 */}
        <div className="space-y-6">
          {/* 优化后的文案 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">优化后的文案</h3>
                </div>
                {optimizedContent && (
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    复制
                  </Button>
                )}
              </div>
              
              {/* 笔记标题输入 */}
              <div className="mb-4">
                <Label htmlFor="noteTitle" className="text-sm font-medium mb-2 block">
                  笔记标题 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="noteTitle"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="请输入笔记标题（最多20字）"
                  maxLength={20}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {noteTitle.length}/20
                </p>
              </div>
              
              {isOptimizing && !optimizedContent ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-5/6 bg-muted" />
                  <Skeleton className="h-4 w-4/6 bg-muted" />
                </div>
              ) : optimizedContent ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {optimizedContent}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  优化后的文案将显示在这里
                </p>
              )}
            </CardContent>
          </Card>

          {/* 图片预览 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">图片预览</h3>
                </div>
                {uploadedImages.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleDownloadImages}>
                    <Download className="w-4 h-4 mr-2" />
                    下载全部
                  </Button>
                )}
              </div>
              
              {uploadedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {uploadedImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`图片 ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleImageToImage(imageUrl)}
                        >
                          <Wand2 className="w-4 h-4 mr-1" />
                          二创
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage(index)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  上传的图片将显示在这里
                </p>
              )}
            </CardContent>
          </Card>

          {/* 使用提示 */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
            <CardContent className="p-4">
              <p className="text-sm font-black text-purple-900 mb-2">💡 一键发布流程：</p>
              <ol className="text-xs text-purple-800 space-y-1 font-bold">
                <li>1. 输入笔记标题（必填，最多20字）</li>
                <li>2. 优化文案并上传图片</li>
                <li>3. 点击"发布到小红薯"自动唤起小红书APP</li>
                <li>4. 标题、文案和图片自动填充，点击"发布"完成</li>
              </ol>
            </CardContent>
          </Card>

          {/* 发布按钮 */}
          {optimizedContent.trim() && noteTitle.trim() && uploadedImages.length > 0 ? (
            <Button
              onClick={handlePublish}
              size="lg"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              发布到小红薯
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                size="lg"
                className="w-full"
                disabled
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                发布到小红薯
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {!noteTitle.trim() && '❌ 请输入笔记标题'}
                {noteTitle.trim() && !optimizedContent.trim() && '❌ 请优化文案'}
                {noteTitle.trim() && optimizedContent.trim() && uploadedImages.length === 0 && '❌ 请上传图片'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
