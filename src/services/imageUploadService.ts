import { toast } from 'sonner';
import { uploadSharedImage } from '@/db/selfHostedApi';

export async function uploadImageToSupabase(imageUrl: string, filename: string): Promise<string | null> {
  try {
    const blob = await fetch(imageUrl).then((res) => res.blob());
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    return await uploadSharedImage(file);
  } catch (error) {
    console.error('上传图片异常:', error);
    return null;
  }
}

export async function uploadImagesToSupabase(
  images: Array<{ url: string; filename: string }>,
  onProgress?: (current: number, total: number) => void,
): Promise<string[]> {
  const publicUrls: string[] = [];

  for (let i = 0; i < images.length; i += 1) {
    const image = images[i];
    onProgress?.(i + 1, images.length);

    const publicUrl = await uploadImageToSupabase(image.url, image.filename);
    if (publicUrl) {
      publicUrls.push(publicUrl);
    } else {
      toast.error(`图片 ${i + 1} 上传失败`);
    }
  }

  return publicUrls;
}

export async function checkImageSize(imageUrl: string): Promise<{
  valid: boolean;
  width: number;
  height: number;
  ratio: number;
  message?: string;
}> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;

      if (width < 720) {
        resolve({
          valid: false,
          width,
          height,
          ratio,
          message: `图片宽度不足 720px，当前 ${width}px`,
        });
        return;
      }

      const is3_4 = Math.abs(ratio - 3 / 4) < 0.1;
      const is1_1 = Math.abs(ratio - 1) < 0.1;
      const is4_3 = Math.abs(ratio - 4 / 3) < 0.1;

      if (!is3_4 && !is1_1 && !is4_3) {
        resolve({
          valid: false,
          width,
          height,
          ratio,
          message: `图片比例不符合要求，当前 ${ratio.toFixed(2)}:1`,
        });
        return;
      }

      resolve({
        valid: true,
        width,
        height,
        ratio,
      });
    };

    img.onerror = () => {
      resolve({
        valid: false,
        width: 0,
        height: 0,
        ratio: 0,
        message: '图片加载失败',
      });
    };

    img.src = imageUrl;
  });
}

export async function checkImagesSize(imageUrls: string[]) {
  return Promise.all(
    imageUrls.map(async (url) => ({
      url,
      ...(await checkImageSize(url)),
    })),
  );
}
