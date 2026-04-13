const unsupportedMessage =
  'AI数字人功能仍依赖 Supabase，当前自建后端迁移阶段已临时下线。';

function unsupported(): never {
  throw new Error(unsupportedMessage);
}

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

export async function uploadDigitalHumanAsset(_file: File, _folder: 'avatars' | 'voices'): Promise<string> {
  unsupported();
}

export async function getDigitalHumanHotCopies(_userId: string, _industry: string): Promise<{
  session_id: string;
  copies: DigitalHumanHotCopy[];
}> {
  unsupported();
}

export async function rewriteDigitalHumanCopy(_payload: {
  user_id: string;
  session_id: string;
  source_title: string;
  source_content: string;
}): Promise<{ rewrite_id: string; versions: DigitalHumanRewriteVersion[] }> {
  unsupported();
}

export async function reviewDigitalHumanCopy(_payload: {
  user_id: string;
  rewrite_id: string;
  selected_version_index: number;
  script: string;
}): Promise<DigitalHumanLegalReviewResult> {
  unsupported();
}

export async function submitDigitalHumanJob(_payload: {
  user_id: string;
  rewrite_id: string;
  legal_review_id: string;
  industry: string;
  script_text: string;
  cover_title: string;
  avatar_url: string;
  voice_sample_url: string;
}): Promise<DigitalHumanJobResult> {
  unsupported();
}

export async function queryDigitalHumanJob(_jobId: string): Promise<DigitalHumanJobResult> {
  unsupported();
}
