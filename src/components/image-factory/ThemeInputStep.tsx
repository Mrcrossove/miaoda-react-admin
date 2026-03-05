import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Image as ImageIcon, Upload, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { ContentStyle } from '@/pages/ImageFactoryPage';

// 预设背景模板
const BACKGROUND_TEMPLATES = [
  {
    id: 'vintage',
    name: '复古街景',
    url: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260120/file-92dsnytihvk1.png',
    color: '#D2B48C',
  },
  {
    id: 'yellow',
    name: '黄色网格',
    url: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260120/file-92dsnj19lfr4.png',
    color: '#FFD700',
  },
  {
    id: 'pink',
    name: '粉色梦幻',
    url: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260120/file-92dsnytihvk0.png',
    color: '#FFB6C1',
  },
  {
    id: 'guofeng',
    name: '国风建筑',
    url: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260120/file-92dsnytihvk2.png',
    color: '#F5E6D3',
  },
  {
    id: 'ins',
    name: 'INS简约',
    url: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260120/file-92dsnj19lfr5.png',
    color: '#F5F5F0',
  },
];

// 文案风格配置
const CONTENT_STYLES: { value: ContentStyle; label: string; description: string; emoji: string }[] = [
  { value: 'science', label: '科普风', description: '专业严谨，知识性强', emoji: '📚' },
  { value: 'recommend', label: '种草风', description: '热情推荐，吸引力强', emoji: '🌟' },
  { value: 'cute', label: '可爱风', description: '活泼俏皮，亲和力强', emoji: '🎀' },
];

interface ThemeInputStepProps {
  theme: string;
  itemCount: number;
  contentStyle: ContentStyle;
  backgroundImage: string;
  backgroundType: 'template' | 'upload';
  onThemeChange: (theme: string) => void;
  onItemCountChange: (count: number) => void;
  onContentStyleChange: (style: ContentStyle) => void;
  onBackgroundImageChange: (image: string) => void;
  onBackgroundTypeChange: (type: 'template' | 'upload') => void;
  onConfirm: (
    theme: string,
    itemCount: number,
    contentStyle: ContentStyle,
    backgroundImage: string,
    backgroundType: 'template' | 'upload'
  ) => void;
}

export default function ThemeInputStep({
  theme,
  itemCount,
  contentStyle,
  backgroundImage,
  backgroundType,
  onThemeChange,
  onItemCountChange,
  onContentStyleChange,
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onConfirm,
}: ThemeInputStepProps) {
  const [uploadedImage, setUploadedImage] = useState<string>('');

  // 处理背景模板选择
  const handleTemplateSelect = (templateUrl: string) => {
    onBackgroundImageChange(templateUrl);
    onBackgroundTypeChange('template');
  };

  // 处理背景图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadedImage(imageUrl);
      onBackgroundImageChange(imageUrl);
      onBackgroundTypeChange('upload');
      
    };
    reader.readAsDataURL(file);
  };

  // 处理确认
  const handleConfirm = () => {
    if (!theme.trim()) {
      toast.error('请输入核心主题');
      return;
    }

    if (!backgroundImage) {
      toast.error('请选择背景图片');
      return;
    }

    // 直接调用onConfirm，使用次数检查已在ImageFactoryPage中处理
    onConfirm(theme, itemCount, contentStyle, backgroundImage, backgroundType);
  };

  return (
    <div className="space-y-6">
      {/* 核心主题输入 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">核心主题</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="theme">输入您的主题（例如：湿气越吃越少、口红推荐）</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              placeholder="请输入核心主题..."
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              💡 提示：主题将作为大标题显示在图片顶部
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 参数配置 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">参数配置</h3>
          
          <div className="space-y-6">
            {/* 图片数量（固定为3张） */}
            <div className="space-y-2">
              <Label>图片数量</Label>
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg font-bold text-xl">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">固定生成 3 张图片</p>
                  <p className="text-xs text-muted-foreground">
                    每张图片包含一个小标题和对应的文案
                  </p>
                </div>
              </div>
            </div>

            {/* 文案风格 */}
            <div className="space-y-3">
              <Label>文案风格</Label>
              <RadioGroup
                value={contentStyle}
                onValueChange={(value) => onContentStyleChange(value as ContentStyle)}
              >
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                  {CONTENT_STYLES.map((style) => (
                    <label
                      key={style.value}
                      className={`
                        flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${contentStyle === style.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <RadioGroupItem value={style.value} id={style.value} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{style.emoji}</span>
                          <span className="font-medium">{style.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{style.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 背景选择 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">背景选择</h3>
          </div>

          {/* 背景模板 */}
          <div className="space-y-3 mb-6">
            <Label>预设模板</Label>
            <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
              {BACKGROUND_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.url)}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                    ${backgroundType === 'template' && backgroundImage === template.url
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: template.color }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-xs font-medium">{template.name}</span>
                  </div>
                  {backgroundType === 'template' && backgroundImage === template.url && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 上传背景 */}
          <div className="space-y-3">
            <Label>或上传自定义背景</Label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">点击上传背景图片</span>
                </div>
              </label>
              
              {uploadedImage && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={uploadedImage}
                    alt="上传的背景"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG 格式，建议尺寸 1080x1920，最大 5MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 确认按钮 */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleConfirm}
          className="px-8"
        >
          下一步：AI生成内容
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
