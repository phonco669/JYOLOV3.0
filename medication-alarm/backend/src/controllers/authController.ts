import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import axios from 'axios';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    let openid: string;

    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;
    const jwtSecret = process.env.JWT_SECRET;
    const isProd = process.env.NODE_ENV === 'production';

    if (!jwtSecret) {
      if (isProd) {
        console.error('CRITICAL: JWT_SECRET missing in production!');
        return res.status(500).json({ error: 'Security configuration missing' });
      }
      console.warn('JWT_SECRET missing, using fallback for development');
    }

    const effectiveJwtSecret = jwtSecret || 'dev_jwt_secret_fallback';

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
      // If in production, do NOT allow mock login
      if (isProd) {
        console.error('CRITICAL: WECHAT_APP_ID or WECHAT_APP_SECRET missing in production!');
        return res.status(500).json({ error: 'Authentication configuration missing' });
      }
      
      // Mock Login (Fall back if no credentials provided - useful for dev/testing without real credentials)
      console.warn('WECHAT_APP_ID or WECHAT_APP_SECRET not set. Using mock login.');
      openid = `mock_openid_${code}`;
    }

    let user = await UserModel.findByOpenId(openid);

    if (!user) {
      user = await UserModel.create(openid);
    }

    const token = jwt.sign({ id: user.id }, effectiveJwtSecret, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserInfo = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { nickname, avatar_url } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await UserModel.update(userId, { nickname, avatar_url });
    const updatedUser = await UserModel.findById(userId);
    res.json({ message: 'User info updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
