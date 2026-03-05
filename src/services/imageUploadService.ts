/**
 * 图片上传服务
 * 将本地图片上传到Supabase Storage，获取公网HTTPS URL
 * 用于小红书分享（小红书要求图片必须是公网可访问的HTTPS URL）
 */

import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

/**
 * 上传图片到Supabase Storage
 * @param imageUrl 本地图片URL（data URL或blob URL）
 * @param filename 文件名
 * @returns 公网HTTPS URL
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  filename: string
): Promise<string | null> {
  try {
    // 1. 将data URL或blob URL转换为Blob
    const blob = await fetch(imageUrl).then(res => res.blob());

    // 2. 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = filename.split('.').pop() || 'png';
    const uniqueFilename = `xhs-share/${timestamp}-${randomStr}.${ext}`;

    // 3. 上传到Supabase Storage
    const { data, error } = await supabase.storage
      .from('images') // 使用images bucket
      .upload(uniqueFilename, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('上传图片失败:', error);
      return null;
    }

    // 4. 获取公网URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('上传图片异常:', error);
    return null;
  }
}

/**
 * 批量上传图片到Supabase Storage
 * @param images 图片数组（data URL或blob URL）
 * @param onProgress 上传进度回调
 * @returns 公网HTTPS URL数组
 */
export async function uploadImagesToSupabase(
  images: Array<{ url: string; filename: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const publicUrls: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // 更新进度
    onProgress?.(i + 1, images.length);
    
    // 上传单张图片
    const publicUrl = await uploadImageToSupabase(image.url, image.filename);
    
    if (publicUrl) {
      publicUrls.push(publicUrl);
    } else {
      console.error(`图片上传失败: ${image.filename}`);
      toast.error(`图片 ${i + 1} 上传失败`);
    }
  }
  
  return publicUrls;
}

/**
 * 检查图片尺寸是否符合小红书要求
 * 小红书建议：首图比例 3:4（竖图）或 1:1（方图），宽度 ≥ 720px
 * @param imageUrl 图片URL
 * @returns 是否符合要求
 */
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
      
      // 检查宽度
      if (width < 720) {
        resolve({
          valid: false,
          width,
          height,
          ratio,
          message: `图片宽度不足720px（当前${width}px）`,
        });
        return;
      }
      
      // 检查比例（允许一定误差）
      const is3_4 = Math.abs(ratio - 3/4) < 0.1; // 3:4 竖图
      const is1_1 = Math.abs(ratio - 1) < 0.1;   // 1:1 方图
      const is4_3 = Math.abs(ratio - 4/3) < 0.1; // 4:3 横图
      
      if (!is3_4 && !is1_1 && !is4_3) {
        resolve({
          valid: false,
          width,
          height,
          ratio,
          message: `图片比例不符合要求（当前${ratio.toFixed(2)}:1，建议3:4、1:1或4:3）`,
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

/**
 * 批量检查图片尺寸
 * @param imageUrls 图片URL数组
 * @returns 检查结果数组
 */
export async function checkImagesSize(imageUrls: string[]): Promise<Array<{
  url: string;
  valid: boolean;
  width: number;
  height: number;
  ratio: number;
  message?: string;
}>> {
  const results = await Promise.all(
    imageUrls.map(async (url) => {
      const result = await checkImageSize(url);
      return {
        url,
        ...result,
      };
    })
  );
  
  return results;
}
