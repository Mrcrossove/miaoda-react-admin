import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const mockVideoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

function getProgressState(elapsedMs: number) {
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  if (elapsedSeconds < 4) {
    return { status: 'queued', step: 'voice_clone', progress: 18 };
  }
  if (elapsedSeconds < 8) {
    return { status: 'processing', step: 'tts', progress: 42 };
  }
  if (elapsedSeconds < 12) {
    return { status: 'processing', step: 'avatar_render', progress: 68 };
  }
  if (elapsedSeconds < 16) {
    return { status: 'processing', step: 'final_compose', progress: 90 };
  }

  return { status: 'completed', step: 'final_compose', progress: 100 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'job_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: job, error } = await supabase
      .from('digital_human_jobs')
      .select('id, title, status, step, progress, cover_title, cover_subtitle, cover_url, video_url, subtitle_url, audio_url, error_message, created_at')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      throw error || new Error('Job not found');
    }

    let updatedJob = job;

    if (job.status !== 'completed' && job.status !== 'failed' && job.status !== 'cancelled') {
      const progressState = getProgressState(Date.now() - new Date(job.created_at).getTime());
      const updatePayload: Record<string, unknown> = {
        status: progressState.status,
        step: progressState.step,
        progress: progressState.progress,
      };

      if (progressState.status === 'completed') {
        updatePayload.video_url = job.video_url || mockVideoUrl;
        updatePayload.subtitle_url = job.subtitle_url || 'mock-subtitle-ready';
        updatePayload.cover_url = job.cover_url;
      }

      const { data } = await supabase
        .from('digital_human_jobs')
        .update(updatePayload)
        .eq('id', jobId)
        .select('id, title, status, step, progress, cover_title, cover_subtitle, cover_url, video_url, subtitle_url, audio_url, error_message, created_at')
        .single();

      if (data) {
        updatedJob = data;
      }
    }

    return new Response(JSON.stringify({
      job_id: updatedJob.id,
      status: updatedJob.status,
      step: updatedJob.step,
      progress: updatedJob.progress,
      title: updatedJob.title,
      cover_title: updatedJob.cover_title,
      cover_subtitle: updatedJob.cover_subtitle,
      cover_url: updatedJob.cover_url,
      video_url: updatedJob.video_url,
      subtitle_url: updatedJob.subtitle_url,
      error_message: updatedJob.error_message,
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
