import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import axios from 'axios';

export const login = async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    let openid: string;

    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (appId && appSecret) {
      // Real WeChat Login
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode) {
        console.error('WeChat API Error:', response.data);
        return res.status(400).json({ error: 'WeChat login failed', details: response.data });
      }

      openid = response.data.openid;
    } else {
      // Mock Login (Fall back if no credentials provided - useful for dev/testing without real credentials)
      console.warn('WECHAT_APP_ID or WECHAT_APP_SECRET not set. Using mock login.');
      openid = `mock_openid_${code}`; 
    }

    let user = await UserModel.findByOpenId(openid);

    if (!user) {
      user = await UserModel.create(openid);
    }

    // Return a token (in real app, use JWT)
    res.json({ token: `token_${user.id}`, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
