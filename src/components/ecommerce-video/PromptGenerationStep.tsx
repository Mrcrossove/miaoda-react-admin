import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PromptGenerator, type ProductCategory, type VideoDuration } from '@/utils/promptGenerator';

interface PromptGenerationStepProps {
  productName: string;
  sellingPoints: string;
  category: ProductCategory;
  duration: VideoDuration;
  onPromptGenerated: (prompt: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PromptGenerationStep({
  productName,
  sellingPoints,
  category,
  duration,
  onPromptGenerated,
  onNext,
  onBack,
}: PromptGenerationStepProps) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [prompt, setPrompt] = useState('');

  // 自动生成提示词
  useEffect(() => {
    generatePrompt();
  }, []);

  const generatePrompt = async () => {
    setGenerating(true);
    setGenerated(false);

    try {
      // 模拟生成延迟（实际使用时可以调用大模型API）
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 解析卖点（每行一个）
      const sellingPointsArray = sellingPoints
        .split('\n')
        .map((point) => point.trim())
        .filter((point) => point.length > 0);

      // 使用Prompt生成器
      const generatedPrompt = PromptGenerator.generatePrompt({
        productName,
        sellingPoints: sellingPointsArray,
        category,
        duration,
      });

      setPrompt(generatedPrompt);
      onPromptGenerated(generatedPrompt);
      setGenerated(true);
      
    } catch (error) {
      console.error('提示词生成失败:', error);
      toast.error(error instanceof Error ? error.message : '提示词生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 生成状态卡片 */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {generating && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">正在生成视频提示词...</h3>
                  <p className="text-sm text-muted-foreground">
                    根据您的产品信息和卖点，智能生成SORA2视频提示词
                  </p>
                </div>
              </>
            )}

            {!generating && generated && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">提示词生成成功！</h3>
                  <p className="text-sm text-muted-foreground">
                    已根据{category}品类的专业模板生成{duration}秒视频提示词
                  </p>
                </div>
              </>
            )}

            {!generating && !generated && (
              <>
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">生成失败</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    提示词生成失败，请重试
                  </p>
                  <Button onClick={generatePrompt}>
                    重新生成
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 生成的提示词预览 */}
      {generated && prompt && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              生成的提示词预览
            </h4>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {prompt}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              下一步可以查看和编辑此提示词
            </p>
          </CardContent>
        </Card>
      )}

      {/* 产品信息摘要 */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold mb-3">产品信息摘要</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-20">产品名称：</span>
              <span className="font-medium">{productName}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-20">产品品类：</span>
              <span className="font-medium">{category}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-20">视频时长：</span>
              <span className="font-medium">{duration}秒</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-20">核心卖点：</span>
              <div className="flex-1">
                {sellingPoints.split('\n').map((point, index) => (
                  point.trim() && (
                    <div key={index} className="font-medium">
                      {index + 1}. {point.trim()}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导航按钮 */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button onClick={onNext} disabled={!generated}>
          下一步：编辑提示词
        </Button>
      </div>
    </div>
  );
}
