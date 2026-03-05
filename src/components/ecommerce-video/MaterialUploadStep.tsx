import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductCategory, VideoDuration } from '@/utils/promptGenerator';
import { PromptGenerator } from '@/utils/promptGenerator';

interface MaterialUploadStepProps {
  productImages: string[];
  productName: string;
  sellingPoints: string;
  category: ProductCategory;
  duration: VideoDuration;
  onProductImagesChange: (images: string[]) => void;
  onProductNameChange: (name: string) => void;
  onSellingPointsChange: (points: string) => void;
  onCategoryChange: (category: ProductCategory) => void;
  onDurationChange: (duration: VideoDuration) => void;
  onNext: () => void;
}

export default function MaterialUploadStep({
  productImages,
  productName,
  sellingPoints,
  category,
  duration,
  onProductImagesChange,
  onProductNameChange,
  onSellingPointsChange,
  onCategoryChange,
  onDurationChange,
  onNext,
}: MaterialUploadStepProps) {
  const [uploading, setUploading] = useState(false);

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 检查图片数量限制
    if (productImages.length + files.length > 5) {
      toast.error('最多只能上传5张产品图片');
      return;
    }

    setUploading(true);
    try {
      // TODO: 实现图片上传到Supabase Storage
      // 暂时使用本地预览URL
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是有效的图片文件`);
          continue;
        }

        // 验证文件大小（最大20MB）
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} 文件过大，请上传小于20MB的图片`);
          continue;
        }

        // 创建本地预览URL
        const previewUrl = URL.createObjectURL(file);
        newImages.push(previewUrl);
      }

      onProductImagesChange([...productImages, ...newImages]);
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index);
    onProductImagesChange(newImages);
    
  };

  // 验证表单
  const validateForm = () => {
    if (productImages.length === 0) {
      toast.error('请至少上传1张产品图片');
      return false;
    }
    if (!productName.trim()) {
      toast.error('请输入产品名称');
      return false;
    }
    if (productName.trim().length > 20) {
      toast.error('产品名称不能超过20个字');
      return false;
    }
    if (!sellingPoints.trim()) {
      toast.error('请输入核心卖点');
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
      {/* 产品图片上传 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            产品图片（最多5张）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            {/* 已上传的图片 */}
            {productImages.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg border-2 border-border overflow-hidden group">
                <img
                  src={image}
                  alt={`产品图片${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* 上传按钮 */}
            {productImages.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <div className="text-sm text-muted-foreground">上传中...</div>
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">上传图片</span>
                  </>
                )}
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            支持JPG、PNG格式，单张图片不超过20MB，建议上传高清产品图（分辨率≥1080×1080）
          </p>
        </CardContent>
      </Card>

      {/* 产品信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">产品信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 产品名称 */}
          <div className="space-y-2">
            <Label htmlFor="productName">
              产品名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="productName"
              placeholder="请输入产品名称（限20字内）"
              value={productName}
              onChange={(e) => onProductNameChange(e.target.value)}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              {productName.length}/20 字
            </p>
          </div>

          {/* 核心卖点 */}
          <div className="space-y-2">
            <Label htmlFor="sellingPoints">
              核心卖点 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="sellingPoints"
              placeholder="请输入产品核心卖点，每行一个，按优先级排序&#10;例如：&#10;纯植物成分&#10;敏感肌可用&#10;补水不黏腻"
              value={sellingPoints}
              onChange={(e) => onSellingPointsChange(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              每行一个卖点，按优先级从高到低排序，建议2-3个卖点
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 视频配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">视频配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 产品品类 */}
          <div className="space-y-2">
            <Label htmlFor="category">产品品类</Label>
            <Select value={category} onValueChange={(v) => onCategoryChange(v as ProductCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PromptGenerator.getCategories().map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              选择产品品类，系统将使用对应的专业模板生成视频
            </p>
          </div>

          {/* 视频时长 */}
          <div className="space-y-2">
            <Label htmlFor="duration">视频时长</Label>
            <Select value={duration.toString()} onValueChange={(v) => onDurationChange(parseInt(v) as VideoDuration)}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10秒</SelectItem>
                <SelectItem value="15">15秒</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              选择视频时长，10秒适合快速展示，15秒可展示更多卖点
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 下一步按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg" className="w-full xl:w-auto">
          下一步：生成提示词
        </Button>
      </div>
    </div>
  );
}
