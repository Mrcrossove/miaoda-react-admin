/**
 * 图片压缩工具
 * 将图片压缩到指定大小以下
 */

interface CompressOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
}

/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的文件
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    initialQuality = 0.8,
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // 如果文件已经小于目标大小，直接返回
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 计算新的尺寸
        let { width, height } = img;
        
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height / width) * maxWidthOrHeight;
            width = maxWidthOrHeight;
          } else {
            width = (width / height) * maxWidthOrHeight;
            height = maxWidthOrHeight;
          }
        }

        // 创建canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取canvas上下文'));
          return;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 尝试不同的质量级别进行压缩
        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('压缩失败'));
                return;
              }

              // 如果压缩后的大小仍然超过限制，降低质量继续压缩
              if (blob.size > maxSizeBytes && quality > 0.1) {
                tryCompress(quality - 0.1);
                return;
              }

              // 创建新的File对象
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.webp'),
                { type: 'image/webp' }
              );

              resolve(compressedFile);
            },
            'image/webp',
            quality
          );
        };

        tryCompress(initialQuality);
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 验证文件名是否符合规范（只包含英文字母和数字）
 * @param filename 文件名
 * @returns 是否符合规范
 */
export function validateFilename(filename: string): boolean {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return /^[a-zA-Z0-9_-]+$/.test(nameWithoutExt);
}

/**
 * 生成安全的文件名
 * @param originalName 原始文件名
 * @returns 安全的文件名
 */
export function generateSafeFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `product_${timestamp}_${random}.${ext}`;
}
