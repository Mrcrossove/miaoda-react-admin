import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Wechatpay } from 'npm:wechatpay-axios-plugin';
import ShortUniqueId from 'npm:short-unique-id';

// 生成订单号
function generateOrderNo() {
  const uid = new ShortUniqueId({ length: 8 });
  const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `CRD-${yymmdd}-${uid.rnd()}`;
}

// 创建微信支付URL
async function createWechatPayUrl(
  MERCHANT_ID: string,
  MERCHANT_APP_ID: string,
  MCH_CERT_SERIAL_NO: string,
  MCH_PRIVATE_KEY: string,
  WECHAT_PAY_PUBLIC_KEY_ID: string,
  WECHAT_PAY_PUBLIC_KEY: string,
  outTradeNo: string,
  amount: number,
  notifyUrl: string,
  description: string
) {
  try {
    const wxpay = new Wechatpay({
      mchid: MERCHANT_ID,
      serial: MCH_CERT_SERIAL_NO,
      privateKey: MCH_PRIVATE_KEY,
      certs: { [WECHAT_PAY_PUBLIC_KEY_ID]: WECHAT_PAY_PUBLIC_KEY }
    });
    
    const res = await wxpay.v3.pay.transactions.native.post({
      mchid: MERCHANT_ID,
      out_trade_no: outTradeNo,
      appid: MERCHANT_APP_ID,
      description: description,
      notify_url: notifyUrl,
      amount: { total: Math.round(amount * 100) }
    }, { headers: { 'Wechatpay-Serial': WECHAT_PAY_PUBLIC_KEY_ID } });
    
    if (res.data.code_url) {
      console.log(`[WeChatPay SUCCESS] outTradeNo=${outTradeNo}, url=${res.data.code_url}`);
      return { success: true, url: res.data.code_url };
    } else {
      console.error(`[WeChatPay FAILED] outTradeNo=${outTradeNo}, error=${res.data.message || JSON.stringify(res.data)}`);
      return { success: false, error: res.data.message || JSON.stringify(res.data) };
    }
  } catch (err) {
    console.error(`[WeChatPay ERROR] outTradeNo=${outTradeNo}, error=${err?.message || String(err)}`);
    return { success: false, error: err?.message || String(err) };
  }
}

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 获取请求体
    const { packageId } = await req.json();
    
    if (!packageId) {
      return new Response(
        JSON.stringify({ error: '缺少套餐ID' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 获取授权token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '未授权' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 创建Supabase客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 验证用户
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '用户验证失败' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 查询套餐信息
    const { data: packageData, error: packageError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (packageError || !packageData) {
      return new Response(
        JSON.stringify({ error: '套餐不存在或已下架' }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 生成订单号
    const orderNo = generateOrderNo();

    // 获取微信支付配置
    const MERCHANT_ID = Deno.env.get('MERCHANT_ID');
    const MERCHANT_APP_ID = Deno.env.get('MERCHANT_APP_ID');
    const MCH_CERT_SERIAL_NO = Deno.env.get('MCH_CERT_SERIAL_NO');
    const MCH_PRIVATE_KEY = Deno.env.get('MCH_PRIVATE_KEY');
    const WECHAT_PAY_PUBLIC_KEY_ID = Deno.env.get('WECHAT_PAY_PUBLIC_KEY_ID');
    const WECHAT_PAY_PUBLIC_KEY = Deno.env.get('WECHAT_PAY_PUBLIC_KEY');

    if (!MERCHANT_ID || !MERCHANT_APP_ID || !MCH_CERT_SERIAL_NO || !MCH_PRIVATE_KEY || !WECHAT_PAY_PUBLIC_KEY_ID || !WECHAT_PAY_PUBLIC_KEY) {
      return new Response(
        JSON.stringify({ error: '微信支付配置不完整，请在插件中心配置密钥' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 创建微信支付URL
    const notifyUrl = `${supabaseUrl}/functions/v1/wechat_payment_webhook`;
    const payResult = await createWechatPayUrl(
      MERCHANT_ID,
      MERCHANT_APP_ID,
      MCH_CERT_SERIAL_NO,
      MCH_PRIVATE_KEY,
      WECHAT_PAY_PUBLIC_KEY_ID,
      WECHAT_PAY_PUBLIC_KEY,
      orderNo,
      Number(packageData.price),
      notifyUrl,
      `充值${packageData.name}`
    );

    if (!payResult.success) {
      return new Response(
        JSON.stringify({ error: `创建支付失败: ${payResult.error}` }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 创建订单记录
    const { data: orderData, error: orderError } = await supabase
      .from('credit_orders')
      .insert({
        order_no: orderNo,
        user_id: user.id,
        package_id: packageId,
        credits: packageData.credits,
        amount: packageData.price,
        status: 'pending',
        wechat_pay_url: payResult.url
      })
      .select()
      .single();

    if (orderError) {
      console.error('创建订单失败:', orderError);
      return new Response(
        JSON.stringify({ error: '创建订单失败' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        orderNo: orderNo,
        payUrl: payResult.url
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('创建订单异常:', error);
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
