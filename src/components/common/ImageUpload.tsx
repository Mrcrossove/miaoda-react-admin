import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage, generateSafeFilename } from '@/utils/imageCompress';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ value = [], onChange, maxImages = 3, className }: ImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 检查是否超过最大数量
    if (value.length + files.length > maxImages) {
      toast.error(`最多只能上传${maxImages}张图片`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是有效的图片文件`);
          continue;
        }

        // 压缩图片
        let fileToUpload = file;
        const fileSizeMB = file.size / (1024 * 1024);
        
        if (fileSizeMB > 1) {
          toast.info(`${file.name} 超过1MB，正在自动压缩...`);
          try {
            fileToUpload = await compressImage(file);
            const compressedSizeMB = fileToUpload.size / (1024 * 1024);
          } catch (error) {
            toast.error(`${file.name} 压缩失败`);
            continue;
          }
        }

        // 生成安全的文件名
        const safeFilename = generateSafeFilename(file.name);
        const filePath = `${user?.id}/${safeFilename}`;

        // 上传到Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('app-8sm6r7tdrncx_product_images')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('上传失败:', uploadError);
          toast.error(`${file.name} 上传失败`);
          continue;
        }

        // 获取公开URL
        const { data: { publicUrl } } = supabase.storage
          .from('app-8sm6r7tdrncx_product_images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        
        // 更新进度
        setProgress(((i + 1) / files.length) * 100);
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }
    } catch (error) {
      console.error('上传过程出错:', error);
      toast.error('上传失败，请重试');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 图片预览网格 */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={url}
                alt={`产品图片 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {value.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                上传中...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                上传图片 ({value.length}/{maxImages})
              </>
            )}
          </Button>
        </div>
      )}

      {/* 上传进度条 */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            上传进度: {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* 提示信息 */}
      <p className="text-xs text-muted-foreground">
        支持 JPG、PNG、WEBP、GIF 格式，单张图片最大1MB，超过将自动压缩
      </p>
    </div>
  );
}
