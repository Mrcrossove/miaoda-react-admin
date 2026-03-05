export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// 用户角色
export type UserRole = 'user' | 'admin';

// 用户资料
export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}

// 热榜类型
export type TrendingType = '2' | '3' | '4' | '6' | '7' | '8' | '9' | '10' | '14';

// 热榜项
export interface TrendingItem {
  title: string;
  hot: number;
  url: string;
  date: string;
  translateTitle?: string;
}

// 垂类类型
export type VerticalType = '美食' | '美妆' | '汽车';

// 媒体类型
export type MediaType = '抖音' | '小红书';

// 时间范围
export type TimeRange = 1 | 3 | 7;

// 垂类热榜项
export interface VerticalTrendingItem {
  sum: number;
  mediaType: string;
  title: string;
  description: string;
  url: string;
  hotNum: string;
  likeCount: number;
  commentsCount: number;
  sharedCount: number;
  readCount: number;
}

// 平台类型
export type PlatformType = 'xiaohongshu' | 'douyin';

// 产品
export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  selling_points: string | null;
  target_audience: string | null;
  image_urls: string[];
  platform: string;
  created_at: string;
  updated_at: string;
}

// 小红书笔记
export interface XiaohongshuNote {
  note_id: string;
  title: string;
  description: string;
  cover_image: string;
  images: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  collect_count: number;
  author_name: string;
  author_avatar: string;
  note_url: string;
  publish_time: string;
  _original_liked_count?: string; // 原始点赞数格式（如"2万"）
}

// ==================== 电商视频生成系统类型定义 ====================

// 视频时长选项
export type VideoDuration = '15s' | '30s' | '60s';

// 视频分辨率选项
export type VideoResolution = '720P' | '1080P';

// 视频比例选项
export type VideoAspectRatio = '9:16' | '1:1' | '3:4';

// 语言风格选项
export type LanguageStyle = 'professional' | 'lively' | 'friendly' | 'concise' | 'custom';

// 背景音乐风格
export type MusicStyle = 'ecommerce' | 'cozy' | 'energetic';

// 镜头类型
export type CameraType = 'closeup' | 'medium' | 'wide';

// 转场方式
export type TransitionType = 'cut' | 'fade' | 'zoom' | 'none';

// 视频基础配置
export interface VideoBasicConfig {
  duration: VideoDuration;
  aspect_ratio: VideoAspectRatio;
  resolution: VideoResolution;
  background_music: MusicStyle;
  language_style: LanguageStyle;
  custom_style?: string; // 自定义风格描述
  subtitle_status: boolean;
  watermark_status: boolean;
  watermark_image?: string; // 水印图片URL
}

// 产品信息
export interface ProductInfo {
  name: string; // 产品名称（限20字）
  description: string; // 产品简介（限500字）
  selling_points?: string[]; // 补充卖点（最多3条，每条50字）
  warnings?: string; // 禁忌说明（限100字）
}

// 人物信息
export interface CharacterInfo {
  has_character: boolean; // 是否有人物
  character_features?: string; // 人物特征描述
  character_image?: string; // 人物照片URL
}

// 分镜信息
export interface Shot {
  shot_id: number;
  duration: string; // 如"3s"
  content: string; // 画面内容描述
  camera: string; // 镜头运镜描述
  transition: TransitionType;
  character_action?: string; // 人物动作（有人物时）
  product_action?: string; // 产品动态（无人物时）
  lines: string; // 台词
  subtitle: string; // 字幕
  sound_effect?: string; // 音效
}

// 视频脚本
export interface VideoScript {
  video_basic: VideoBasicConfig;
  character_info: CharacterInfo;
  product_info: ProductInfo;
  shots: Shot[];
}

// 素材上传状态
export interface UploadedMaterial {
  product_images: string[]; // 产品图片URL列表（最多5张）
  character_image?: string; // 人物图片URL
}

// 视频生成状态
export type VideoGenerationStatus = 'idle' | 'uploading' | 'generating_script' | 'previewing' | 'generating_video' | 'completed' | 'failed';

// 视频生成结果
export interface VideoGenerationResult {
  video_url: string;
  thumbnail_url?: string;
  duration: string;
  resolution: string;
  aspect_ratio: string;
  file_size?: number;
  created_at: string;
}

