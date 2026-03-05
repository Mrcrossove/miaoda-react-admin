import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Image as ImageIcon, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getAllTemplates, type BackgroundTemplate } from '@/config/backgroundTemplates';

interface InputCollectionStepProps {
  backgroundImage: string;
  backgroundType: 'template' | 'upload';
  mainTitle: string;
  imageCount: 3 | 4 | 5;
  onBackgroundImageChange: (image: string, type: 'template' | 'upload') => void;
  onMainTitleChange: (title: string) => void;
  onImageCountChange: (count: 3 | 4 | 5) => void;
  onNext: () => void;
}

export default function InputCollectionStep({
  backgroundImage,
  backgroundType,
  mainTitle,
  imageCount,
  onBackgroundImageChange,
  onMainTitleChange,
  onImageCountChange,
  onNext,
}: InputCollectionStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const templates = getAllTemplates();

  // 处理模板选择
  const handleTemplateSelect = (template: BackgroundTemplate) => {
    setSelectedTemplate(template.id);
    onBackgroundImageChange(template.fullImage, 'template');
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 验证文件大小（最大20MB）
    if (file.size > 20 * 1024 * 1024) {
      toast.error('图片文件过大，请上传小于20MB的图片');
      return;
    }

    setUploading(true);
    try {
      // TODO: 上传到Supabase Storage
      // 暂时使用本地预览URL
      const previewUrl = URL.createObjectURL(file);
      onBackgroundImageChange(previewUrl, 'upload');
      
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 验证表单
  const validateForm = () => {
    if (!backgroundImage) {
      toast.error('请选择或上传背景图');
      return false;
    }
    if (!mainTitle.trim()) {
      toast.error('请输入主标题');
      return false;
    }
    if (mainTitle.trim().length > 20) {
      toast.error('主标题不能超过20个字');
      return false;
    }
    return true;
  };

  // 处理下一步
  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* 背景图选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            选择背景图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">模板背景</TabsTrigger>
              <TabsTrigger value="upload">自定义上传</TabsTrigger>
            </TabsList>

            {/* 模板背景 */}
            <TabsContent value="template" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                选择预设的通用背景模板，适配全行业
              </p>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedTemplate === template.id && backgroundType === 'template'
                        ? 'border-primary shadow-lg'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full aspect-[9/16] object-cover"
                    />
                    {selectedTemplate === template.id && backgroundType === 'template' && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="p-2 bg-white">
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 自定义上传 */}
            <TabsContent value="upload" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                上传自定义背景图，建议尺寸≥1080×1920
              </p>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="background-upload"
                />
                <label
                  htmlFor="background-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  {uploading ? (
                    <div className="text-sm text-muted-foreground">上传中...</div>
                  ) : backgroundImage && backgroundType === 'upload' ? (
                    <>
                      <img
                        src={backgroundImage}
                        alt="背景图预览"
                        className="max-w-xs max-h-64 rounded-lg"
                      />
                      <Button variant="outline" size="sm">
                        重新上传
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">点击上传背景图</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          支持JPG、PNG格式，最大20MB
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 主标题输入 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">输入主标题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mainTitle">
              主标题 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mainTitle"
              placeholder="请输入核心主题（如：肾虚了怎么办？/新手化妆教程/职场高效复盘）"
              value={mainTitle}
              onChange={(e) => onMainTitleChange(e.target.value)}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              {mainTitle.length}/20 字
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 生成数量选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">选择生成数量</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={imageCount.toString()}
            onValueChange={(value) => onImageCountChange(parseInt(value) as 3 | 4 | 5)}
          >
            <div className="grid grid-cols-3 gap-4">
              <div
                className={`relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  imageCount === 3 ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => onImageCountChange(3)}
              >
                <RadioGroupItem value="3" id="count-3" className="sr-only" />
                <Label htmlFor="count-3" className="cursor-pointer">
                  <div className="text-2xl font-bold mb-1">3张</div>
                  <div className="text-xs text-muted-foreground">快速生成</div>
                </Label>
              </div>

              <div
                className={`relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  imageCount === 4 ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => onImageCountChange(4)}
              >
                <RadioGroupItem value="4" id="count-4" className="sr-only" />
                <Label htmlFor="count-4" className="cursor-pointer">
                  <div className="text-2xl font-bold mb-1">4张</div>
                  <div className="text-xs text-muted-foreground">推荐</div>
                </Label>
              </div>

              <div
                className={`relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  imageCount === 5 ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => onImageCountChange(5)}
              >
                <RadioGroupItem value="5" id="count-5" className="sr-only" />
                <Label htmlFor="count-5" className="cursor-pointer">
                  <div className="text-2xl font-bold mb-1">5张</div>
                  <div className="text-xs text-muted-foreground">丰富内容</div>
                </Label>
              </div>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-4">
            系统将根据主标题生成对应数量的分标题和文案
          </p>
        </CardContent>
      </Card>

      {/* 下一步按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg" className="w-full xl:w-auto">
          下一步：生成文案
        </Button>
      </div>
    </div>
  );
}
