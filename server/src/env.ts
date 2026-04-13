import 'dotenv/config';

function readEnv(name: string, fallback = '') {
  return process.env[name]?.trim() || fallback;
}

function requireEnv(name: string) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number.parseInt(readEnv('PORT', '3000'), 10),
  corsOrigin: readEnv('CORS_ORIGIN', '*'),
  arkApiKey: readEnv('ARK_API_KEY'),
  dashscopeApiKey: readEnv('DASHSCOPE_API_KEY'),
  integrationsApiKey: readEnv('INTEGRATIONS_API_KEY'),
  soraApiKey: readEnv('SORA_API_KEY'),
  xiaohongshuCookie: readEnv('XIAOHONGSHU_COOKIE'),
  xiaohongshuApiKey: readEnv('XIAOHONGSHU_API_KEY'),
  xhsAppKey: readEnv('XHS_APP_KEY'),
  xhsAppSecret: readEnv('XHS_APP_SECRET'),
};

export { requireEnv };
