import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const mockTemplates = [
  '顾客不是不愿意消费，而是你的价值感没有在前3秒说清楚。',
  '同城门店最容易忽略的，不是流量，而是成交前的信任建立。',
  '做美业老板IP，最赚钱的内容不是展示项目，而是展示判断力。',
  '一个高客单门店，最怕的不是没人来，而是来了之后没有留下记忆点。',
  '别再只拍环境和仪器，真正让顾客下单的是她看见变化的那一刻。',
  '同样是发视频，为什么有人天天爆单，有人只是自嗨式更新？',
  '美业内容一旦只会夸效果，就很容易踩红线，也很难建立专业感。',
  '你以为用户想看项目流程，其实她更想知道自己为什么现在必须做。',
  '真正能让顾客复购的，不是活动力度，而是你说话时的专业说服力。',
  '今年本地美业内容最有效的打法，是把案例讲成用户决策故事。',
];

function buildCopies(industry: string) {
  return mockTemplates.map((template, index) => ({
    id: `mock-copy-${index + 1}`,
    title: `${industry}爆款口播选题 ${index + 1}`,
    content: `${template} 这条内容适合做${industry}老板IP口播，用“问题拆解 + 用户场景 + 行动建议”的结构来讲，完播率和咨询率都会更高。`,
    platform: 'xiaohongshu',
    metrics: {
      likes: 1200 + index * 187,
      comments: 90 + index * 13,
      saves: 300 + index * 25,
    },
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, user_id } = await req.json();

    if (!industry || !user_id) {
      return new Response(JSON.stringify({ error: 'industry and user_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const copies = buildCopies(industry);

    const { data: session, error } = await supabase
      .from('digital_human_hot_copy_sessions')
      .insert({
        user_id,
        industry,
        platform: 'xiaohongshu',
        keywords: [industry, `${industry}口播`, `${industry}同城获客`],
        source_payload: copies,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ session_id: session.id, copies }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
