import { Request, Response } from 'express';
import { UserModel } from '../models/User';

export const login = async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    // Mocking WeChat Login: In a real app, use code to get openid from WeChat API
    // For now, we assume 'code' is the 'openid' for simplicity in dev
    const openid = `mock_openid_${code}`; 

    let user = await UserModel.findByOpenId(openid);

    if (!user) {
      user = await UserModel.create(openid);
    }

    // Return a mock token (in real app, use JWT)
    res.json({ token: `mock_token_${user.id}`, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
