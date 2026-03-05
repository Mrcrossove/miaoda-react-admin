import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Download, Loader2, CheckCircle2, XCircle, RotateCcw, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateSoraVideo, querySoraVideo, checkVideoGenerationUsage, recordVideoGenerationUsage } from '@/db/api';
import type { VideoDuration } from '@/utils/promptGenerator';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VideoGenerationStepProps {
  prompt: string;
  duration: VideoDuration;
  onBack: () => void;
  onReset: () => void;
}

type GenerationStatus = 'idle' | 'checking' | 'submitting' | 'generating' | 'completed' | 'failed' | 'limit_reached';

export default function VideoGenerationStep({
  prompt,
  duration,
  onBack,
  onReset,
}: VideoGenerationStepProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [taskId, setTaskId] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [usageCount, setUsageCount] = useState<number>(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [usageRecorded, setUsageRecorded] = useState(false); // 标记是否已记录使用次数

  // 自动开始生成前先检查使用次数
  useEffect(() => {
    checkUsageAndStart();
  }, []);

  // 检查使用次数并开始生成
  const checkUsageAndStart = async () => {
    setStatus('checking');
    
    try {
      // 检查今日使用次数
      const result = await checkVideoGenerationUsage();

      if (!result.canUse) {
        setStatus('limit_reached');
        setUsageCount(result.usageCount || 0);
        setShowLimitDialog(true);
        return;
      }

      // 可以使用，开始生成
      startGeneration();
    } catch (error) {
      console.error('检查使用次数失败:', error);
      toast.error('检查使用次数失败，请重试');
      setStatus('failed');
    }
  };

  // 开始生成视频
  const startGeneration = async () => {
    setStatus('submitting');
    setProgress(0);
    setErrorMessage('');

    try {
      // 只在第一次生成时记录使用次数（避免重新生成时重复扣除）
      if (!usageRecorded) {
        const usageResult = await recordVideoGenerationUsage();
        
        if (!usageResult.success) {
          throw new Error('记录使用次数失败');
        }
        
        setUsageCount(usageResult.usageCount || 0);
        setUsageRecorded(true); // 标记已记录
      }
      
      // 调用SORA2 API提交生成请求
      const result = await generateSoraVideo(prompt, duration);
      
      setTaskId(result.video_id);
      setStatus('generating');
      

      // 开始轮询查询状态
      pollTaskStatus(result.video_id);
    } catch (error) {
      console.error('视频生成失败:', error);
      setStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : '视频生成失败');
      toast.error('视频生成失败，请重试');
    }
  };

  // 轮询查询任务状态
  const pollTaskStatus = async (videoId: string) => {
    const maxAttempts = 20; // 最多查询20次（约10分钟，每30秒一次）
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setStatus('failed');
        setErrorMessage('视频生成超时，请重试');
        toast.error('视频生成超时');
        return;
      }

      try {
        // 调用SORA2 API查询状态
        const result = await querySoraVideo(videoId);
        
        attempts++;
        setProgress(result.progress);

        console.log('视频状态:', result.status, '进度:', result.progress);

        // 检查状态
        if (result.status === 'completed') {
          // 视频生成完成，扣除灵感值
          await handleVideoCompleted(result.video_url || '');
          return;
        } else if (result.status === 'failed') {
          setStatus('failed');
          setErrorMessage('视频生成失败');
          toast.error('视频生成失败');
          return;
        }

        // 继续轮询（每30秒）
        setTimeout(poll, 30000);
      } catch (error) {
        console.error('查询任务状态失败:', error);
        
        // 如果是网络错误，继续重试
        if (attempts < maxAttempts) {
          setTimeout(poll, 30000);
        } else {
          setStatus('failed');
          setErrorMessage('查询任务状态失败');
          toast.error('查询任务状态失败');
        }
      }
    };

    // 首次查询延迟5秒
    setTimeout(poll, 5000);
  };

  // 视频生成完成
  const handleVideoCompleted = async (url: string) => {
    // 使用次数已在startGeneration中记录，这里只需要更新状态
    setStatus('completed');
    setProgress(100);
    setVideoUrl(url);
    // 成功时不显示通知
  };

  // 下载视频
  const handleDownload = () => {
    if (!videoUrl) return;
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `ecommerce-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    
  };

  // 重新生成
  const handleRegenerate = () => {
    setStatus('idle');
    setTaskId('');
    setVideoUrl('');
    setProgress(0);
    setErrorMessage('');
    startGeneration();
  };

  return (
    <div className="space-y-6">
      {/* 次数用完对话框 */}
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange" />
              今日免费次数已用完
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>每天可免费生成 <span className="text-success font-semibold">1次</span> 电商视频</p>
              <p>您今日已使用：<span className="text-orange font-semibold">{usageCount}次</span></p>
              <p>明天再来吧！或者联系客服开通更多权限</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onBack}>返回</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/profile')}>
              前往个人中心
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 生成状态卡片 */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {/* 检查使用次数中 */}
            {status === 'checking' && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">正在检查使用次数...</h3>
                  <p className="text-sm text-muted-foreground">
                    请稍候
                  </p>
                </div>
              </>
            )}

            {/* 次数用完 */}
            {status === 'limit_reached' && (
              <>
                <div className="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">今日免费次数已用完</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    每天可免费生成1次，今日已使用：{usageCount}次
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onBack}>
                      返回
                    </Button>
                    <Button onClick={() => navigate('/profile')}>
                      前往个人中心
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* 提交中 */}
            {status === 'submitting' && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">正在提交生成任务...</h3>
                  <p className="text-sm text-muted-foreground">
                    正在将您的提示词发送到SORA2服务器
                  </p>
                </div>
              </>
            )}

            {/* 生成中 */}
            {status === 'generating' && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-2">正在生成视频...</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    SORA2正在根据您的提示词生成视频，请耐心等待
                  </p>
                  {/* 进度条 */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    生成进度：{progress}%
                  </p>
                  {taskId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      任务ID：{taskId}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* 生成完成 */}
            {status === 'completed' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">视频生成完成！</h3>
                  <p className="text-sm text-muted-foreground">
                    您的电商视频已生成完成，可以预览和下载
                  </p>
                </div>
              </>
            )}

            {/* 生成失败 */}
            {status === 'failed' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">视频生成失败</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {errorMessage || '视频生成过程中出现错误，请重试'}
                  </p>
                  <Button onClick={handleRegenerate} className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    重新生成
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 视频预览 */}
      {status === 'completed' && videoUrl && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              视频预览
            </h4>
            <div className="aspect-[9/16] max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
                poster="/placeholder-video.jpg"
              >
                您的浏览器不支持视频播放
              </video>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack} disabled={status === 'submitting' || status === 'generating'}>
          上一步
        </Button>
        
        <div className="flex items-center gap-2">
          {status === 'completed' && (
            <>
              <Button variant="outline" onClick={handleRegenerate} className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                重新生成
              </Button>
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                下载视频
              </Button>
            </>
          )}
          
          {(status === 'completed' || status === 'failed') && (
            <Button variant="outline" onClick={onReset}>
              创建新视频
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
