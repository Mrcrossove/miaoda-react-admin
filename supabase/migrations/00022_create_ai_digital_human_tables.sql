CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TYPE public.digital_human_profile_status AS ENUM ('pending', 'processing', 'ready', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.digital_human_job_status AS ENUM ('draft', 'queued', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.digital_human_job_step AS ENUM (
    'hot_copy_collect',
    'rewrite',
    'legal_review',
    'voice_clone',
    'tts',
    'avatar_prepare',
    'avatar_render',
    'subtitle_align',
    'bgm_match',
    'cover_generate',
    'final_compose'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.digital_human_risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.digital_human_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sample_audio_url TEXT NOT NULL,
  transcript TEXT,
  language TEXT DEFAULT 'zh-CN',
  provider TEXT DEFAULT 'mock-api',
  provider_voice_id TEXT,
  status public.digital_human_profile_status NOT NULL DEFAULT 'pending',
  preview_audio_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_human_avatar_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  cover_url TEXT,
  provider TEXT DEFAULT 'mock-api',
  provider_avatar_id TEXT,
  status public.digital_human_profile_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT digital_human_avatar_profiles_source_check
    CHECK (image_url IS NOT NULL OR video_url IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.digital_human_hot_copy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  industry TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'xiaohongshu',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_source_id TEXT,
  selected_source_title TEXT,
  selected_source_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_human_rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.digital_human_hot_copy_sessions(id) ON DELETE CASCADE,
  source_title TEXT,
  source_content TEXT,
  persona TEXT,
  tone TEXT,
  rewrite_versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_version_index INTEGER,
  final_script TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_human_legal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rewrite_id UUID NOT NULL REFERENCES public.digital_human_rewrites(id) ON DELETE CASCADE,
  risk_level public.digital_human_risk_level NOT NULL DEFAULT 'low',
  illegal_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_tone_spans JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_notes TEXT,
  reviewed_script TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_human_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  voice_profile_id UUID REFERENCES public.digital_human_voice_profiles(id) ON DELETE SET NULL,
  avatar_profile_id UUID REFERENCES public.digital_human_avatar_profiles(id) ON DELETE SET NULL,
  rewrite_id UUID REFERENCES public.digital_human_rewrites(id) ON DELETE SET NULL,
  legal_review_id UUID REFERENCES public.digital_human_legal_reviews(id) ON DELETE SET NULL,
  script_text TEXT NOT NULL,
  status public.digital_human_job_status NOT NULL DEFAULT 'draft',
  step public.digital_human_job_step,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  aspect_ratio TEXT NOT NULL DEFAULT '9:16',
  duration_target INTEGER,
  background_mode TEXT NOT NULL DEFAULT 'auto',
  bgm_mode TEXT NOT NULL DEFAULT 'auto',
  subtitle_enabled BOOLEAN NOT NULL DEFAULT true,
  cover_title TEXT,
  cover_subtitle TEXT,
  audio_url TEXT,
  subtitle_url TEXT,
  cover_url TEXT,
  video_url TEXT,
  provider TEXT DEFAULT 'mock-api',
  provider_job_id TEXT,
  callback_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_human_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

CREATE TABLE IF NOT EXISTS public.digital_human_credit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.digital_human_jobs(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dh_voice_profiles_user_created
  ON public.digital_human_voice_profiles(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dh_avatar_profiles_user_created
  ON public.digital_human_avatar_profiles(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dh_hot_copy_sessions_user_created
  ON public.digital_human_hot_copy_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dh_rewrites_user_created
  ON public.digital_human_rewrites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dh_legal_reviews_user_created
  ON public.digital_human_legal_reviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dh_jobs_user_created
  ON public.digital_human_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dh_jobs_status_created
  ON public.digital_human_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dh_jobs_provider_job_id
  ON public.digital_human_jobs(provider_job_id);
CREATE INDEX IF NOT EXISTS idx_dh_usage_user_date
  ON public.digital_human_usage(user_id, usage_date);

DROP TRIGGER IF EXISTS trg_dh_voice_profiles_updated_at ON public.digital_human_voice_profiles;
CREATE TRIGGER trg_dh_voice_profiles_updated_at
BEFORE UPDATE ON public.digital_human_voice_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dh_avatar_profiles_updated_at ON public.digital_human_avatar_profiles;
CREATE TRIGGER trg_dh_avatar_profiles_updated_at
BEFORE UPDATE ON public.digital_human_avatar_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dh_hot_copy_sessions_updated_at ON public.digital_human_hot_copy_sessions;
CREATE TRIGGER trg_dh_hot_copy_sessions_updated_at
BEFORE UPDATE ON public.digital_human_hot_copy_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dh_rewrites_updated_at ON public.digital_human_rewrites;
CREATE TRIGGER trg_dh_rewrites_updated_at
BEFORE UPDATE ON public.digital_human_rewrites
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dh_legal_reviews_updated_at ON public.digital_human_legal_reviews;
CREATE TRIGGER trg_dh_legal_reviews_updated_at
BEFORE UPDATE ON public.digital_human_legal_reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dh_jobs_updated_at ON public.digital_human_jobs;
CREATE TRIGGER trg_dh_jobs_updated_at
BEFORE UPDATE ON public.digital_human_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dh_usage_updated_at ON public.digital_human_usage;
CREATE TRIGGER trg_dh_usage_updated_at
BEFORE UPDATE ON public.digital_human_usage
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.digital_human_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_human_avatar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_human_hot_copy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_human_rewrites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_human_legal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_human_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_human_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_human_credit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许通过函数操作AI数字人声音档案"
ON public.digital_human_voice_profiles FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "允许通过函数操作AI数字人形象档案"
ON public.digital_human_avatar_profiles FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "允许通过函数操作AI数字人爆款会话"
ON public.digital_human_hot_copy_sessions FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "允许通过函数操作AI数字人仿写记录"
ON public.digital_human_rewrites FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "允许通过函数操作AI数字人法务审查"
ON public.digital_human_legal_reviews FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "允许通过函数操作AI数字人任务"
ON public.digital_human_jobs FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "允许通过函数操作AI数字人使用记录"
ON public.digital_human_usage FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "允许通过函数操作AI数字人扣费日志"
ON public.digital_human_credit_logs FOR ALL
USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-8sm6r7tdrncx_digital_human_assets',
  'app-8sm6r7tdrncx_digital_human_assets',
  true,
  104857600,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-8sm6r7tdrncx_digital_human_results',
  'app-8sm6r7tdrncx_digital_human_results',
  true,
  209715200,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'text/plain', 'application/json', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "允许所有用户上传数字人素材"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'app-8sm6r7tdrncx_digital_human_assets');

CREATE POLICY "允许所有用户查看数字人素材"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-8sm6r7tdrncx_digital_human_assets');

CREATE POLICY "允许所有用户删除数字人素材"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'app-8sm6r7tdrncx_digital_human_assets');

CREATE POLICY "允许所有用户上传数字人成果"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'app-8sm6r7tdrncx_digital_human_results');

CREATE POLICY "允许所有用户查看数字人成果"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-8sm6r7tdrncx_digital_human_results');

CREATE POLICY "允许所有用户删除数字人成果"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'app-8sm6r7tdrncx_digital_human_results');
