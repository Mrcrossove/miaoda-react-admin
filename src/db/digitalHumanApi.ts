import { supabase } from './supabase';

export interface DigitalHumanHotCopy {
  id: string;
  title: string;
  content: string;
  platform: string;
  metrics: {
    likes: number;
    comments: number;
    saves: number;
  };
}

export interface DigitalHumanRewriteVersion {
  title: string;
  style: string;
  script: string;
}

export interface DigitalHumanLegalReviewResult {
  review_id: string;
  risk_level: 'low' | 'medium' | 'high';
  illegal_terms: Array<{ term: string; reason: string }>;
  ai_tone_spans: Array<{ text: string; reason: string }>;
  suggestions: string[];
  reviewed_script: string;
}

export interface DigitalHumanJobResult {
  job_id: string;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  step: string | null;
  progress: number;
  title?: string;
  cover_title?: string | null;
  cover_subtitle?: string | null;
  cover_url?: string | null;
  video_url?: string | null;
  subtitle_url?: string | null;
  error_message?: string | null;
}

export async function uploadDigitalHumanAsset(
  file: File,
  folder: 'avatars' | 'voices',
): Promise<string> {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).slice(2, 10);
  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${folder}/${timestamp}_${randomStr}.${ext}`;

  const { error } = await supabase.storage
    .from('app-8sm6r7tdrncx_digital_human_assets')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('上传数字人素材失败:', error);
    throw new Error(error.message || '上传数字人素材失败');
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('app-8sm6r7tdrncx_digital_human_assets').getPublicUrl(fileName);

  return publicUrl;
}

export async function getDigitalHumanHotCopies(userId: string, industry: string): Promise<{
  session_id: string;
  copies: DigitalHumanHotCopy[];
}> {
  const { data, error } = await supabase.functions.invoke('digital-human-hot-copies', {
    body: JSON.stringify({ user_id: userId, industry }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (error) {
    throw new Error(error.message || '获取爆款文案失败');
  }

  return data;
}

export async function rewriteDigitalHumanCopy(payload: {
  user_id: string;
  session_id: string;
  source_title: string;
  source_content: string;
}): Promise<{ rewrite_id: string; versions: DigitalHumanRewriteVersion[] }> {
  const { data, error } = await supabase.functions.invoke('digital-human-rewrite', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });

  if (error) {
    throw new Error(error.message || '仿写失败');
  }

  return data;
}

export async function reviewDigitalHumanCopy(payload: {
  user_id: string;
  rewrite_id: string;
  selected_version_index: number;
  script: string;
}): Promise<DigitalHumanLegalReviewResult> {
  const { data, error } = await supabase.functions.invoke('digital-human-legal-review', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });

  if (error) {
    throw new Error(error.message || '法务审查失败');
  }

  return data;
}

export async function submitDigitalHumanJob(payload: {
  user_id: string;
  rewrite_id: string;
  legal_review_id: string;
  industry: string;
  script_text: string;
  cover_title: string;
  avatar_url: string;
  voice_sample_url: string;
}): Promise<DigitalHumanJobResult> {
  const { data, error } = await supabase.functions.invoke('digital-human-submit-job', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });

  if (error) {
    throw new Error(error.message || '提交数字人任务失败');
  }

  return data;
}

export async function queryDigitalHumanJob(jobId: string): Promise<DigitalHumanJobResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/digital-human-query-job?job_id=${jobId}`, {
    method: 'GET',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || '查询数字人任务失败');
  }

  return JSON.parse(text);
}
