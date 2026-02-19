import axios from 'axios';

let cachedToken: { token: string; expiresAt: number } | null = null;

const canSendReal = () => !!(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET);

async function getAccessToken(): Promise<string> {
  if (!canSendReal()) {
    return 'mock_token';
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}`;
  const resp = await axios.get(url);
  if (resp.data.access_token) {
    cachedToken = {
      token: resp.data.access_token,
      expiresAt: now + (resp.data.expires_in || 7200) * 1000,
    };
    return cachedToken.token;
  } else {
    throw new Error(`Get access_token failed: ${JSON.stringify(resp.data)}`);
  }
}

export async function sendSubscriptionMessage(params: {
  touser: string;
  template_id: string;
  page?: string;
  data: Record<string, any>;
}) {
  if (!canSendReal()) {
    console.log('[SUBMSG][MOCK] send', params);
    return { mock: true };
  }
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`;
  const resp = await axios.post(url, params);
  return resp.data;
}

export const WechatService = { sendSubscriptionMessage };
