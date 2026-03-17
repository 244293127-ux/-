// 扣子 API 配置（上线版：PAT 必须放在服务端环境变量里，前端不可存密钥）
const COZE_BASE = 'https://api.coze.cn';
export const COZE_CONFIG = {
  // PAT 已移除：上线时由 Vercel Serverless（/api/coze）代理注入
  BOT_ID: '7615218949697126443',
  API_URL: `${COZE_BASE}/v3/chat`,
  BASE: COZE_BASE,
};
