import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  sub_title: string;
  content: string;
}

interface ContentEditStepProps {
  contentList: ContentItem[];
  onContentConfirmed: (contentList: ContentItem[]) => void;
  onBack: () => void;
}

export default function ContentEditStep({
  contentList: initialContentList,
  onContentConfirmed,
  onBack,
}: ContentEditStepProps) {
  const [contentList, setContentList] = useState<ContentItem[]>(initialContentList);

  // 更新分标题
  const handleSubTitleChange = (index: number, value: string) => {
    const newList = [...contentList];
    newList[index].sub_title = value;
    setContentList(newList);
  };

  // 更新文案
  const handleContentChange = (index: number, value: string) => {
    const newList = [...contentList];
    newList[index].content = value;
    setContentList(newList);
  };

  // 删除条目
  const handleDelete = (index: number) => {
    if (contentList.length <= 1) {
      toast.error('至少保留1个文案');
      return;
    }
    const newList = contentList.filter((_, i) => i !== index);
    setContentList(newList);
    
  };

  // 验证并确认
  const handleConfirm = () => {
    // 验证所有条目
    for (let i = 0; i < contentList.length; i++) {
      const item = contentList[i];
      if (!item.sub_title.trim()) {
        toast.error(`第${i + 1}个分标题不能为空`);
        return;
      }
      if (!item.content.trim()) {
        toast.error(`第${i + 1}个文案不能为空`);
        return;
      }
    }

    onContentConfirmed(contentList);
  };

  return (
    <div className="space-y-6">
      {/* 提示信息 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">编辑提示</p>
              <ul className="space-y-1 text-blue-700">
                <li>• 可以修改分标题和文案内容</li>
                <li>• 可以删除不需要的条目（至少保留1个）</li>
                <li>• 确认后将开始生成配图</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文案编辑列表 */}
      <div className="space-y-4">
        {contentList.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* 头部 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <span className="font-semibold">第{index + 1}张图</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* 分标题编辑 */}
                <div className="space-y-2">
                  <Label htmlFor={`sub-title-${index}`}>
                    分标题 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`sub-title-${index}`}
                    value={item.sub_title}
                    onChange={(e) => handleSubTitleChange(index, e.target.value)}
                    placeholder="1-4字"
                    maxLength={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {item.sub_title.length}/4 字
                  </p>
                </div>

                {/* 文案编辑 */}
                <div className="space-y-2">
                  <Label htmlFor={`content-${index}`}>
                    文案 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id={`content-${index}`}
                    value={item.content}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    placeholder="50-100字，带Emoji"
                    rows={4}
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground">
                    {item.content.length}/150 字
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          上一步
        </Button>
        <Button onClick={handleConfirm} className="flex-1">
          确认生成配图
        </Button>
      </div>
    </div>
  );
}
