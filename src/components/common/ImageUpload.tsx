import { useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { uploadProductImage } from '@/db/selfHostedApi';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { compressImage, generateSafeFilename } from '@/utils/imageCompress';

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

    if (value.length + files.length > maxImages) {
      toast.error(`最多只能上传 ${maxImages} 张图片`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是有效的图片文件`);
          continue;
        }

        let fileToUpload = file;
        if (file.size / (1024 * 1024) > 1) {
          try {
            fileToUpload = await compressImage(file);
          } catch {
            toast.error(`${file.name} 压缩失败`);
            continue;
          }
        }

        const safeFilename = generateSafeFilename(file.name);
        const normalizedFile = new File([fileToUpload], safeFilename, { type: fileToUpload.type });
        const publicUrl = await uploadProductImage(normalizedFile, user?.id);
        uploadedUrls.push(publicUrl);
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
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <img src={url} alt={`产品图片 ${index + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

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
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                上传中...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                上传图片 ({value.length}/{maxImages})
              </>
            )}
          </Button>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-xs text-muted-foreground">上传进度: {Math.round(progress)}%</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        支持 JPG、PNG、WEBP、GIF 格式，单张图片超过 1MB 会自动压缩
      </p>
    </div>
  );
}
