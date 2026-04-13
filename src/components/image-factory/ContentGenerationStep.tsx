import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Edit, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateImageFactoryContent } from '@/db/selfHostedApi';
import type { ContentItem, ContentStyle } from '@/pages/ImageFactoryPage';

interface ContentGenerationStepProps {
  theme: string;
  itemCount: number;
  contentStyle: ContentStyle;
  onContentGenerated: (list: ContentItem[]) => void;
  onBack: () => void;
}

export default function ContentGenerationStep({
  theme,
  itemCount,
  contentStyle,
  onContentGenerated,
  onBack,
}: ContentGenerationStepProps) {
  const [loading, setLoading] = useState(false);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 自动生成内容
  useEffect(() => {
    handleGenerate();
  }, []);

  // 生成内容
  const handleGenerate = async () => {
    setLoading(true);
    try {
      console.log('开始生成内容:', { theme, itemCount, contentStyle });
      const result = await generateImageFactoryContent(theme, itemCount, contentStyle);
      console.log('生成结果:', result);
      
      setContentList(result);
    } catch (error: any) {
      console.error('生成失败:', error);
      toast.error(error?.message || '内容生成失败，请重试');
      setContentList([]);
    } finally {
      setLoading(false);
    }
  };

  // 编辑小标题
  const handleEditSubTitle = (index: number, value: string) => {
    const newList = [...contentList];
    newList[index].subTitle = value;
    setContentList(newList);
  };

  // 编辑文案
  const handleEditContent = (index: number, value: string) => {
    const newList = [...contentList];
    newList[index].content = value;
    setContentList(newList);
  };

  // 确认并进入下一步
  const handleConfirm = () => {
    if (contentList.length === 0) {
      toast.error('请先生成内容');
      return;
    }

    // 验证每个项都有内容
    for (let i = 0; i < contentList.length; i++) {
      if (!contentList[i].subTitle.trim()) {
        toast.error(`第 ${i + 1} 个小标题不能为空`);
        return;
      }
      if (!contentList[i].content.trim()) {
        toast.error(`第 ${i + 1} 个文案不能为空`);
        return;
      }
    }

    onContentGenerated(contentList);
  };

  return (
    <div className="space-y-6">
      {/* 生成状态 */}
      {loading && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-lg mb-1">AI正在生成内容...</p>
                <p className="text-sm text-muted-foreground">
                  根据主题"{theme}"生成 {itemCount} 个小标题和文案
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 生成结果 */}
      {!loading && contentList.length > 0 && (
        <>
          {/* 重新生成按钮 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">生成的内容</h3>
              <span className="text-sm text-muted-foreground">
                （共 {contentList.length} 个）
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新生成
            </Button>
          </div>

          {/* 内容列表 */}
          <div className="space-y-4">
            {contentList.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 序号 */}
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                      {index + 1}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 space-y-4">
                      {/* 小标题 */}
                      <div className="space-y-2">
                        <Label htmlFor={`subtitle-${index}`}>小标题</Label>
                        <Textarea
                          id={`subtitle-${index}`}
                          value={item.subTitle}
                          onChange={(e) => handleEditSubTitle(index, e.target.value)}
                          onFocus={() => setEditingIndex(index)}
                          onBlur={() => setEditingIndex(null)}
                          className="resize-none font-semibold"
                          rows={1}
                        />
                      </div>

                      {/* 文案 */}
                      <div className="space-y-2">
                        <Label htmlFor={`content-${index}`}>
                          文案
                          <span className="text-xs text-muted-foreground ml-2">
                            （{item.content.length}/50字）
                          </span>
                        </Label>
                        <Textarea
                          id={`content-${index}`}
                          value={item.content}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 50) {
                              handleEditContent(index, value);
                            }
                          }}
                          onFocus={() => setEditingIndex(index)}
                          onBlur={() => setEditingIndex(null)}
                          className="resize-none"
                          rows={2}
                          maxLength={50}
                        />
                      </div>
                    </div>

                    {/* 编辑图标 */}
                    {editingIndex === index && (
                      <Edit className="w-5 h-5 text-primary shrink-0 mt-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 提示信息 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700">
                💡 提示：您可以直接编辑小标题和文案，也可以点击"重新生成"获取新内容
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* 生成失败 */}
      {!loading && contentList.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">内容生成失败</p>
            <p className="text-sm text-muted-foreground mb-4">
              请点击下方按钮重新生成
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重新生成
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </Button>

        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={loading || contentList.length === 0}
          className="px-8"
        >
          下一步：选择图片
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
