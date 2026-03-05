import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 创建Supabase客户端（使用service_role密钥以绕过RLS）
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 调用清理函数
    const { error } = await supabase.rpc('cleanup_expired_products');

    if (error) {
      console.error('清理过期产品失败:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 查询剩余产品数量
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log('清理完成，剩余产品数量:', count);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '过期产品已清理',
        remainingProducts: count || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('清理过程出错:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
