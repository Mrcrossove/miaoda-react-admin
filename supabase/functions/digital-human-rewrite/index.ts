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
    const { user_id, session_id, source_title, source_content } = await req.json();

    if (!user_id || !session_id || !source_title || !source_content) {
      return new Response(JSON.stringify({ error: 'missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const versions = [
      {
        title: `${source_title} · 稳妥版`,
        style: '稳妥版',
        script: '很多美业老板拍内容，最大的误区是上来就讲项目。真正能让客户停下来的，是先说清楚她正在面临什么问题。今天我想用一个真实门店场景告诉你，为什么顾客不是不消费，而是还没感受到你这里值得相信。只要你把专业判断、用户变化和行动建议讲清楚，咨询自然会来。',
      },
      {
        title: `${source_title} · 转化版`,
        style: '转化版',
        script: '如果你店里最近咨询少、成交慢，先别急着怪平台。大多数时候，不是流量不行，而是你的视频没有把顾客最在意的结果说透。她想听的不是项目名称，而是她为什么现在要做、做完会有什么变化、为什么应该在你这里做。把这三件事讲明白，内容才会开始带来成交。',
      },
      {
        title: `${source_title} · 情绪版`,
        style: '情绪版',
        script: '很多顾客走进美业门店，其实不是来买项目的，她是来买一种被认真对待、被看见变化的确定感。可惜很多老板天天发内容，只会展示环境和仪器，却没有说出顾客心里真正那句“我是不是还有机会变更好”。内容一旦能替顾客把这句话说出来，信任就会开始发生。',
      },
    ];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from('digital_human_rewrites')
      .insert({
        user_id,
        session_id,
        source_title,
        source_content,
        persona: '美业老板IP',
        tone: '专业口播',
        rewrite_versions: versions,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ rewrite_id: data.id, versions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
