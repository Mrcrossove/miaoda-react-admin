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
    const { user_id, rewrite_id, selected_version_index, script } = await req.json();

    if (!user_id || !rewrite_id || typeof selected_version_index !== 'number' || !script) {
      return new Response(JSON.stringify({ error: 'missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reviewedScript = script
      .replaceAll('自然会来', '更容易进来')
      .replaceAll('一定', '更有机会')
      .replaceAll('最', '更');

    const illegalTerms = [
      { term: '最', reason: '绝对化表达，建议改成更、相对更适合等表述' },
    ];
    const aiToneSpans = [
      { text: '真正能让客户停下来的', reason: '表达偏模板化，可换成更具体的门店场景' },
    ];
    const suggestions = [
      '尽量加入真实门店场景，例如顾客咨询前后的犹豫点。',
      '减少结论先行的表达，多用“我发现”“很多顾客会问”这类口语化句式。',
      '涉及效果时避免承诺式措辞，强调因人而异和专业判断。',
    ];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase
      .from('digital_human_rewrites')
      .update({
        selected_version_index,
        final_script: script,
      })
      .eq('id', rewrite_id);

    const { data, error } = await supabase
      .from('digital_human_legal_reviews')
      .insert({
        user_id,
        rewrite_id,
        risk_level: 'medium',
        illegal_terms: illegalTerms,
        ai_tone_spans: aiToneSpans,
        suggestions,
        review_notes: 'Mock 法务审查已完成，建议人工复核后再接真实数字人 API。',
        reviewed_script: reviewedScript,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      review_id: data.id,
      risk_level: 'medium',
      illegal_terms: illegalTerms,
      ai_tone_spans: aiToneSpans,
      suggestions,
      reviewed_script: reviewedScript,
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
