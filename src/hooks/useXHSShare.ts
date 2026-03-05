/**
 * 小红书JS SDK分享Hook
 * 基于小红书官方JS SDK实现一键发布功能
 * 官方文档：https://agora.xiaohongshu.com/doc/js
 * 支持HBuilderX封装的App和网页端
 */

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

// 小红书JS SDK类型声明
declare global {
  interface Window {
    xhs?: {
      share: (params: XHSShareConfig) => void;
    };
    plus?: {
      runtime: {
        openURL: (url: string, successCallback?: (result: unknown) => void, errorCallback?: (error: unknown) => void) => void;
        isApplicationExist: (options: { pname?: string; action?: string }, callback: (installed: boolean) => void) => void;
      };
      nativeUI: {
        toast: (message: string) => void;
      };
      android?: {
        addNewIntentHandler: (handler: (intent: unknown) => void) => void;
      };
      navigator?: {
        setWhitelist: (schemes: string[]) => void;
      };
    };
  }
}

/**
 * 小红书分享配置（官方API结构）
 */
export interface XHSShareConfig {
  /** 分享内容信息 */
  shareInfo: {
    /** 笔记类型：'normal'（图文）或 'video'（视频） */
    type: 'normal' | 'video';
    /** 笔记标题（可选） */
    title?: string;
    /** 笔记正文（可选） */
    content?: string;
    /** 图片URL数组（图文类型必填，必须是服务器地址） */
    images?: string[];
    /** 视频URL（视频类型必填，必须是服务器地址） */
    video?: string;
    /** 视频封面图（视频类型可选，必须是服务器地址） */
    cover?: string;
  };
  /** 鉴权配置 */
  verifyConfig: {
    /** 应用的唯一标识 */
    appKey: string;
    /** 随机字符串（服务端生成） */
    nonce: string;
    /** 时间戳（服务端生成） */
    timestamp: string;
    /** 签名（使用access_token加签生成） */
    signature: string;
  };
  /** 失败回调 */
  fail?: (error: unknown) => void;
}

/**
 * 小红书分享参数（简化的用户接口）
 */
export interface XHSShareParams {
  /** 笔记类型 */
  type: 'normal' | 'video';
  /** 笔记标题 */
  title?: string;
  /** 笔记正文 */
  content?: string;
  /** 图片URL数组（必须是公网HTTPS URL） */
  images?: string[];
  /** 视频URL（必须是公网HTTPS URL） */
  video?: string;
  /** 视频封面图（必须是公网HTTPS URL） */
  cover?: string;
  /** 失败回调 */
  fail?: (error: unknown) => void;
}

/**
 * 鉴权配置响应（Edge Function返回的格式）
 */
interface VerifyConfigResponse {
  app_key: string;
  nonce: string;
  timestamp: string;
  signature: string;
}

/**
 * 判断是否在App环境中（HBuilderX封装的WebView）
 */
const isApp = (): boolean => {
  return typeof window.plus !== 'undefined';
};

/**
 * 小红书JS SDK分享Hook
 */
export function useXHSShare() {
  const [isReady, setIsReady] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    // 检查SDK是否加载
    const checkSDK = () => {
      if (typeof window.xhs !== 'undefined') {
        console.log('小红书JS SDK已加载');
        setIsSDKLoaded(true);
        setIsReady(true);
      } else {
        console.warn('小红书JS SDK未加载，请确保已引入SDK脚本');
        setIsSDKLoaded(false);
        setIsReady(false);
      }
    };

    // 在HBuilderX App中，需等待plus环境准备就绪
    if (isApp()) {
      document.addEventListener('plusready', () => {
        // 配置Scheme白名单
        if (window.plus?.navigator) {
          window.plus.navigator.setWhitelist(['xhsdiscover://*']);
        }
        checkSDK();
      }, false);
    } else {
      // 网页环境直接检查
      // 延迟检查，确保SDK脚本已加载
      setTimeout(checkSDK, 100);
    }
  }, []);

  /**
   * 检测小红书是否安装（HBuilderX原生能力）
   */
  const checkXHSInstalled = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isApp() && window.plus) {
        // Android: 检测包名 com.xingin.xhs
        // iOS: 检测URL Scheme xhsdiscover://
        window.plus.runtime.isApplicationExist(
          { 
            pname: 'com.xingin.xhs',  // Android包名
            action: 'xhsdiscover://'   // iOS Scheme
          },
          (installed: boolean) => {
            resolve(installed);
          }
        );
      } else {
        // 网页环境无法检测，默认返回true
        resolve(true);
      }
    });
  }, []);

  /**
   * 获取鉴权配置（从Edge Function获取）
   */
  const getVerifyConfig = useCallback(async (): Promise<VerifyConfigResponse | null> => {
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: VerifyConfigResponse;
        error?: string;
      }>('xhs-auth');

      if (error) {
        console.error('获取鉴权配置失败:', error);
        toast.error('获取鉴权配置失败');
        return null;
      }

      if (!data?.success || !data?.data) {
        console.error('鉴权配置响应异常:', data);
        toast.error('鉴权配置响应异常');
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('获取鉴权配置异常:', error);
      toast.error('获取鉴权配置异常');
      return null;
    }
  }, []);

  /**
   * 降级方案：复制文案+提示保存图片
   */
  const fallbackToClipboard = useCallback((params: XHSShareParams) => {
    const fullText = `${params.title || ''}\n\n${params.content || ''}`;
    
    // 复制到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText).then(() => {
        if (isApp() && window.plus) {
          window.plus.nativeUI.toast('已复制文案，请手动打开小红书粘贴');
        } else {
          toast.info('已复制文案，请手动打开小红书粘贴');
        }
      }).catch(() => {
        toast.error('复制失败，请手动复制文案');
      });
    } else {
      toast.error('浏览器不支持自动复制，请手动复制文案');
    }
  }, []);

  /**
   * 分享到小红书
   * @param params 分享参数
   */
  const shareToXhs = useCallback(async (params: XHSShareParams) => {
    try {
      // 1. 检查SDK是否加载
      if (!isReady || !isSDKLoaded || !window.xhs) {
        console.warn('SDK未加载，使用降级方案');
        fallbackToClipboard(params);
        return;
      }

      // 2. 在HBuilderX App中，检测是否安装小红书
      if (isApp()) {
        const isInstalled = await checkXHSInstalled();
        if (!isInstalled) {
          toast.warning('未检测到小红书APP，请先安装');
          // 引导下载
          if (window.plus) {
            window.plus.runtime.openURL('https://www.xiaohongshu.com');
          }
          return;
        }
      }

      // 3. 验证参数
      if (params.type === 'normal') {
        // 图文类型必须有images
        if (!params.images || params.images.length === 0) {
          toast.error('图文类型必须提供图片');
          return;
        }
        // 检查图片URL是否为公网HTTPS
        const invalidImages = params.images.filter(url => !url.startsWith('https://'));
        if (invalidImages.length > 0) {
          console.error('图片URL必须是公网HTTPS地址:', invalidImages);
          toast.error('图片URL必须是公网HTTPS地址');
          return;
        }
      } else if (params.type === 'video') {
        // 视频类型必须有video
        if (!params.video) {
          toast.error('视频类型必须提供视频URL');
          return;
        }
        // 检查视频URL是否为公网HTTPS
        if (!params.video.startsWith('https://')) {
          console.error('视频URL必须是公网HTTPS地址');
          toast.error('视频URL必须是公网HTTPS地址');
          return;
        }
      }

      // 4. 获取鉴权配置
      toast.info('正在获取鉴权配置...');
      const verifyConfig = await getVerifyConfig();
      
      if (!verifyConfig) {
        console.error('获取鉴权配置失败');
        fallbackToClipboard(params);
        return;
      }

      // 5. 构造分享配置（将Edge Function返回的app_key转换为appKey）
      const shareConfig: XHSShareConfig = {
        shareInfo: {
          type: params.type,
          title: params.title,
          content: params.content,
          images: params.images,
          video: params.video,
          cover: params.cover,
        },
        verifyConfig: {
          appKey: verifyConfig.app_key,  // 转换：app_key → appKey
          nonce: verifyConfig.nonce,
          timestamp: verifyConfig.timestamp,
          signature: verifyConfig.signature,
        },
        fail: (error: unknown) => {
          console.error('小红书分享失败:', error);
          toast.error('分享失败，请重试');
          params.fail?.(error);
          // 失败时使用降级方案
          fallbackToClipboard(params);
        },
      };

      // 6. 调用小红书JS SDK
      console.log('调用小红书JS SDK分享:', shareConfig);
      window.xhs.share(shareConfig);
      
    } catch (error) {
      console.error('分享异常:', error);
      toast.error('分享异常，已复制文案到剪贴板');
      // 异常时使用降级方案
      fallbackToClipboard(params);
    }
  }, [isReady, isSDKLoaded, checkXHSInstalled, getVerifyConfig, fallbackToClipboard]);

  return {
    /** SDK是否准备就绪 */
    isReady,
    /** SDK是否已加载 */
    isSDKLoaded,
    /** 分享到小红书 */
    shareToXhs,
    /** 检测小红书是否安装 */
    checkXHSInstalled,
  };
}
