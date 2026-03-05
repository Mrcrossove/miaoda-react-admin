import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Aes } from 'npm:wechatpay-axios-plugin';

// 解密微信支付回调数据
async function decryptTradeState(
  MCH_API_V3_KEY: string,
  associatedData: string,
  nonce: string,
  ciphertext: string
): Promise<{ status: string; order_no: string }> {
  const plaintext = await Aes.AesGcm.decrypt(ciphertext, MCH_API_V3_KEY, nonce, associatedData);
  const obj = JSON.parse(plaintext);
  return {
    status: (obj.trade_state ?? '').toString() === 'SUCCESS' ? 'SUCCESS' : 'OTHERS',
    order_no: obj.out_trade_no ?? ''
  };
}

Deno.serve(async (req) => {
  try {
    // 获取请求体
    const body = await req.json();
    console.log('收到微信支付回调:', JSON.stringify(body));

    // 获取加密数据
    const { resource } = body;
    if (!resource) {
      console.error('回调数据缺少resource字段');
      return new Response(
        JSON.stringify({ code: 'FAIL', message: '回调数据格式错误' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { associated_data, nonce, ciphertext } = resource;
    if (!associated_data || !nonce || !ciphertext) {
      console.error('回调数据缺少加密字段');
      return new Response(
        JSON.stringify({ code: 'FAIL', message: '回调数据格式错误' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 获取API V3密钥
    const MCH_API_V3_KEY = Deno.env.get('MCH_API_V3_KEY');
    if (!MCH_API_V3_KEY) {
      console.error('MCH_API_V3_KEY未配置');
      return new Response(
        JSON.stringify({ code: 'FAIL', message: '服务器配置错误' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 解密支付结果
    const { status, order_no } = await decryptTradeState(
      MCH_API_V3_KEY,
      associated_data,
      nonce,
      ciphertext
    );

    console.log(`解密结果: status=${status}, order_no=${order_no}`);

    if (status !== 'SUCCESS') {
      console.log('支付未成功，忽略回调');
      return new Response(
        JSON.stringify({ code: 'SUCCESS', message: '处理成功' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 创建Supabase客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 查询订单
    const { data: orderData, error: orderError } = await supabase
      .from('credit_orders')
      .select('*')
      .eq('order_no', order_no)
      .single();

    if (orderError || !orderData) {
      console.error('订单不存在:', order_no);
      return new Response(
        JSON.stringify({ code: 'FAIL', message: '订单不存在' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 检查订单状态（乐观锁）
    if (orderData.status !== 'pending') {
      console.log('订单已处理，忽略回调');
      return new Response(
        JSON.stringify({ code: 'SUCCESS', message: '处理成功' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 更新订单状态
    const { error: updateOrderError } = await supabase
      .from('credit_orders')
      .update({
        status: 'paid',
        payment_id: body.id || '',
        updated_at: new Date().toISOString()
      })
      .eq('order_no', order_no)
      .eq('status', 'pending'); // 乐观锁

    if (updateOrderError) {
      console.error('更新订单状态失败:', updateOrderError);
      return new Response(
        JSON.stringify({ code: 'FAIL', message: '更新订单失败' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 增加用户灵感值
    const { error: updateCreditsError } = await supabase.rpc('update_user_credits_after_payment', {
      p_user_id: orderData.user_id,
      p_credits: orderData.credits
    });

    if (updateCreditsError) {
      console.error('增加灵感值失败:', updateCreditsError);
      // 注意：这里订单已经标记为paid，但灵感值增加失败，需要人工介入
      // 可以考虑添加告警机制
      return new Response(
        JSON.stringify({ code: 'FAIL', message: '增加灵感值失败' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`支付成功: order_no=${order_no}, user_id=${orderData.user_id}, credits=${orderData.credits}`);

    return new Response(
      JSON.stringify({ code: 'SUCCESS', message: '处理成功' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('处理微信支付回调异常:', error);
    return new Response(
      JSON.stringify({ code: 'FAIL', message: '服务器错误' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
