/**
 * 小红书JS SDK分享Hook
 * 基于小红书官方JS SDK实现一键发布功能
 * 官方文档：https://agora.xiaohongshu.com/doc/js
 * 支持HBuilderX封装的App和网页端
 */

import { useEffect, useState, useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { toast } from 'sonner';
import { getJson } from '@/lib/apiBase';

const XHS_SDK_URL = 'https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js';
const XHS_SDK_LOAD_TIMEOUT_MS = 8000;

interface XHSBridgePlugin {
  isXHSInstalled(): Promise<{ installed: boolean }>;
  openXHS(): Promise<{ opened: boolean }>;
}

const XHSBridge = registerPlugin<XHSBridgePlugin>('XHSBridge');

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
 * 判断是否Capacitor原生环境
 */
const isCapacitorNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 确保小红书SDK可用
 */
const ensureXHSSDKLoaded = (): Promise<boolean> => {
  if (typeof window.xhs?.share === 'function') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${XHS_SDK_URL}"]`);
    const deadline = Date.now() + XHS_SDK_LOAD_TIMEOUT_MS;

    const pollSDK = () => {
      if (typeof window.xhs?.share === 'function') {
        resolve(true);
        return;
      }
      if (Date.now() > deadline) {
        resolve(false);
        return;
      }
      window.setTimeout(pollSDK, 100);
    };

    if (existingScript) {
      pollSDK();
      return;
    }

    const script = document.createElement('script');
    script.src = XHS_SDK_URL;
    script.async = true;
    script.onload = pollSDK;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

/**
 * 小红书JS SDK分享Hook
 */
export function useXHSShare() {
  const [isReady, setIsReady] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const updateSDKState = (loaded: boolean) => {
      if (loaded) {
        console.log('小红书JS SDK已就绪');
        setIsSDKLoaded(true);
        setIsReady(true);
      } else {
        console.warn('小红书JS SDK未加载或不可用');
        setIsSDKLoaded(false);
        setIsReady(false);
      }
    };

    const initSDK = async () => {
      const loaded = await ensureXHSSDKLoaded();
      updateSDKState(loaded);

      if (!loaded) {
        console.error('小红书SDK加载失败', {
          sdkUrl: XHS_SDK_URL,
          isCapacitorNative: isCapacitorNative(),
          hasPlusRuntime: isApp(),
        });
      }
    };

    // 在HBuilderX App中，需等待plus环境准备就绪
    if (isApp()) {
      document.addEventListener('plusready', () => {
        // 配置Scheme白名单
        if (window.plus?.navigator) {
          window.plus.navigator.setWhitelist(['xhsdiscover://*']);
        }
        void initSDK();
      }, false);
    } else {
      void initSDK();
    }
  }, []);

  const openXHSApp = useCallback(async (): Promise<boolean> => {
    if (isCapacitorNative()) {
      try {
        const result = await XHSBridge.openXHS();
        return !!result.opened;
      } catch (error) {
        console.error('Capacitor打开小红书失败:', error);
        return false;
      }
    }

    const plusRuntime = window.plus?.runtime;
    if (isApp() && plusRuntime) {
      return new Promise((resolve) => {
        try {
          plusRuntime.openURL(
            'xhsdiscover://',
            () => resolve(true),
            () => resolve(false),
          );
        } catch (error) {
          console.error('plus打开小红书失败:', error);
          resolve(false);
        }
      });
    }

    try {
      window.location.href = 'xhsdiscover://';
      return true;
    } catch (error) {
      console.error('网页打开小红书失败:', error);
      return false;
    }
  }, []);

  /**
   * 检测小红书是否安装（HBuilderX原生能力）
   */
  const checkXHSInstalled = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isCapacitorNative()) {
        XHSBridge.isXHSInstalled()
          .then((result) => resolve(!!result.installed))
          .catch((error) => {
            console.error('Capacitor检测小红书安装状态失败:', error);
            resolve(true);
          });
        return;
      }

      const plusRuntime = window.plus?.runtime;
      if (isApp() && plusRuntime) {
        // Android: 检测包名 com.xingin.xhs
        // iOS: 检测URL Scheme xhsdiscover://
        plusRuntime.isApplicationExist(
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
      const data = await getJson<{
        success: boolean;
        data?: VerifyConfigResponse;
        error?: string;
      }>('/xhs-auth');
      const error = null;

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
  const fallbackToClipboard = useCallback(async (params: XHSShareParams) => {
    const fullText = `${params.title || ''}\n\n${params.content || ''}`;

    try {
      if (isCapacitorNative()) {
        await Clipboard.write({ string: fullText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullText);
      } else {
        toast.error('浏览器不支持自动复制，请手动复制文案');
        return;
      }

      const opened = await openXHSApp();
      if (opened) {
        toast.info('已复制文案，并尝试打开小红书');
        return;
      }

      if (isApp() && window.plus) {
        window.plus.nativeUI.toast('已复制文案，请手动打开小红书粘贴');
      } else {
        toast.info('已复制文案，请手动打开小红书粘贴');
      }
    } catch (error) {
      console.error('降级复制失败:', error);
      toast.error('复制失败，请手动复制文案');
    }
  }, [openXHSApp]);

  /**
   * 分享到小红书
   * @param params 分享参数
   */
  const shareToXhs = useCallback(async (params: XHSShareParams) => {
    try {
      const sdkLoaded = await ensureXHSSDKLoaded();
      const sdkReady = isReady || sdkLoaded;
      if (sdkLoaded !== isSDKLoaded) {
        setIsSDKLoaded(sdkLoaded);
        setIsReady(sdkLoaded);
      }

      // 1. 检查SDK是否加载
      if (!sdkLoaded || !sdkReady || typeof window.xhs?.share !== 'function') {
        console.warn('SDK未加载或不可用，使用降级方案', {
          isReady: sdkReady,
          isSDKLoaded: sdkLoaded,
          hasShareMethod: typeof window.xhs?.share === 'function',
          isCapacitorNative: isCapacitorNative(),
          hasPlusRuntime: isApp(),
        });
        await fallbackToClipboard(params);
        return;
      }

      // 2. 在原生环境中，检测是否安装小红书
      if (isCapacitorNative() || isApp()) {
        const isInstalled = await checkXHSInstalled();
        if (!isInstalled) {
          toast.warning('未检测到小红书APP，请先安装');
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
        await fallbackToClipboard(params);
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
          void fallbackToClipboard(params);
        },
      };

      // 6. 调用小红书JS SDK
      console.log('调用小红书JS SDK分享:', shareConfig);
      window.xhs.share(shareConfig);
      
    } catch (error) {
      console.error('分享异常:', error);
      toast.error('分享异常，已复制文案到剪贴板');
      await fallbackToClipboard(params);
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
