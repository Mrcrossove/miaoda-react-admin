import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      rewrite_id,
      legal_review_id,
      industry,
      script_text,
      cover_title,
      avatar_url,
      voice_sample_url,
    } = await req.json();

    if (!user_id || !rewrite_id || !legal_review_id || !script_text || !avatar_url || !voice_sample_url) {
      return new Response(JSON.stringify({ error: 'missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: voiceProfile, error: voiceError } = await supabase
      .from('digital_human_voice_profiles')
      .insert({
        user_id,
        name: `${industry}声音档案`,
        sample_audio_url: voice_sample_url,
        transcript: 'Mock 声音样本，后续接真实 TTS/声音克隆 API。',
        status: 'ready',
        provider: 'mock-api',
      })
      .select()
      .single();

    if (voiceError) {
      throw voiceError;
    }

    const { data: avatarProfile, error: avatarError } = await supabase
      .from('digital_human_avatar_profiles')
      .insert({
        user_id,
        name: `${industry}形象档案`,
        image_url: avatar_url,
        cover_url: avatar_url,
        status: 'ready',
        provider: 'mock-api',
      })
      .select()
      .single();

    if (avatarError) {
      throw avatarError;
    }

    const { data: job, error: jobError } = await supabase
      .from('digital_human_jobs')
      .insert({
        user_id,
        title: cover_title || `${industry}AI数字人`,
        voice_profile_id: voiceProfile.id,
        avatar_profile_id: avatarProfile.id,
        rewrite_id,
        legal_review_id,
        script_text,
        status: 'queued',
        step: 'voice_clone',
        progress: 10,
        aspect_ratio: '9:16',
        duration_target: 45,
        background_mode: 'template',
        bgm_mode: 'template',
        subtitle_enabled: true,
        cover_title: cover_title || `${industry}老板IP内容模板`,
        cover_subtitle: 'Mock 数字人任务',
        cover_url: avatar_url,
        provider: 'mock-api',
        provider_job_id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    return new Response(JSON.stringify({
      job_id: job.id,
      status: job.status,
      step: job.step,
      progress: job.progress,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
