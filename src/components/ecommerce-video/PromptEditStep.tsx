import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface PromptEditStepProps {
  prompt: string;
  originalPrompt: string;
  onPromptChange: (prompt: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PromptEditStep({
  prompt,
  originalPrompt,
  onPromptChange,
  onNext,
  onBack,
}: PromptEditStepProps) {
  const [isEdited, setIsEdited] = useState(false);

  // 处理提示词修改
  const handlePromptChange = (value: string) => {
    onPromptChange(value);
    setIsEdited(value !== originalPrompt);
  };

  // 还原原始提示词
  const handleRestore = () => {
    onPromptChange(originalPrompt);
    setIsEdited(false);
    
  };

  // 确认生成视频
  const handleConfirm = () => {
    if (!prompt.trim()) {
      toast.error('提示词不能为空');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* 提示词编辑器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              SORA2视频提示词
            </div>
            {isEdited && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                还原
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            rows={15}
            className="font-mono text-sm resize-none"
            placeholder="请输入SORA2视频提示词..."
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              {isEdited && (
                <span className="text-yellow-600">
                  ⚠️ 您已修改提示词，确认后将使用修改后的版本生成视频
                </span>
              )}
              {!isEdited && (
                <span>
                  您可以根据需要修改提示词，以获得更符合预期的视频效果
                </span>
              )}
            </p>
            <span className="text-xs text-muted-foreground">
              {prompt.length} 字符
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 编辑提示 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-semibold">编辑提示：</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>可以修改画面描述、镜头运镜、转场方式等细节</li>
                <li>建议保留"竖屏9:16"、"720p"、"无人物"等关键参数</li>
                <li>修改后请确保提示词逻辑连贯，时长分配合理</li>
                <li>如果不满意修改结果，可以点击"还原"按钮恢复原始版本</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导航按钮 */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button onClick={handleConfirm} size="lg" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          确认生成视频
        </Button>
      </div>
    </div>
  );
}
