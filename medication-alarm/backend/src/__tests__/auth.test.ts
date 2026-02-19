import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { login } from '../controllers/authController';
import { UserModel } from '../models/User';
import axios from 'axios';
import jwt from 'jsonwebtoken';

// --- 模拟环境变量 ---
// 直接在测试文件中设置，确保 Jest 环境能访问
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.WECHAT_APP_ID = 'test_app_id';
process.env.WECHAT_APP_SECRET = 'test_app_secret';

// --- 模拟 jsonwebtoken 模块 ---
// 这个 Mock 现在只用于 authController 中 jwt.sign 的行为
// authenticateToken 的测试将通过直接 Mock authMiddleware 来完成
jest.mock('jsonwebtoken', () => {
  const mockSign = jest.fn((payload, secret, options) => {
    if (secret !== process.env.JWT_SECRET) throw new Error('Invalid secret');
    const userId = payload.id ?? payload.userId;
    return `mock_token_${JSON.stringify({
      userId,
      exp: Math.floor(Date.now() / 1000) + (options?.expiresIn === '7d' ? 7 * 24 * 60 * 60 : 3600),
    })}`;
  });

  return {
    sign: mockSign,
    verify: jest.fn(),
  };
});

// 重新导入模拟后的模块，以便在测试用例中访问 mockSign
const mockJwtSign = jwt.sign as jest.Mock;

// --- 模拟 authMiddleware 模块 ---
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req: Request, res: Response, next: NextFunction) => {
    // 模拟中间件行为：如果请求头有 Authorization，解析出 userId
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer mock_token_')) {
      const tokenPayload = JSON.parse(authHeader.replace('Bearer mock_token_', ''));
      req.user = { id: tokenPayload.userId }; // 模拟 req.user 被设置
      next();
    } else if (authHeader === 'Bearer invalidtoken') {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    } else {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
  }),
}));
// 导入 Mock 后的 authenticateToken
import { authenticateToken } from '../middleware/authMiddleware';

// --- 模拟数据库操作 ---
const mockUsers = [
  { id: 1, openid: 'mock_openid_testcode', created_at: new Date().toISOString() },
  { id: 2, openid: 'existing_openid', created_at: new Date().toISOString() },
];

jest.mock('../models/User', () => ({
  UserModel: {
    findByOpenId: jest.fn(async (openid: string) => {
      return mockUsers.find((user) => user.openid === openid) || null;
    }),
    create: jest.fn(async (openid: string) => {
      const newUser = { id: mockUsers.length + 1, openid, created_at: new Date().toISOString() };
      mockUsers.push(newUser); // 添加到模拟用户列表，以供后续查找
      return newUser;
    }),
  },
}));

// --- 创建一个临时的 Express 应用来测试控制器和中间件 ---
const app = express();
app.use(express.json());

// 注册认证路由
app.post('/api/auth/login', login);

// 注册一个受保护的路由来测试中间件
// 这里使用类型断言，因为在测试环境中，我们确保 req.user 会被中间件设置
app.get('/api/protected', authenticateToken, (req: Request, res: Response) => {
  res.json({ message: `Access granted for user ${req.user!.id}` });
});

describe('Auth Workflow Integration Tests', () => {
  beforeEach(() => {
    // 每次测试前重置 mockUsers，确保测试隔离
    mockUsers.splice(
      0,
      mockUsers.length,
      { id: 1, openid: 'mock_openid_testcode', created_at: new Date().toISOString() },
      { id: 2, openid: 'existing_openid', created_at: new Date().toISOString() },
    );
  });

  afterEach(() => {
    (UserModel.findByOpenId as jest.Mock).mockClear();
    (UserModel.create as jest.Mock).mockClear();
    mockJwtSign.mockClear(); // 清理 mock 函数
    (authenticateToken as jest.Mock).mockClear(); // 清理 mock 函数
    jest.restoreAllMocks(); // 恢复所有被 spy 的 mock
  });

  describe('POST /api/auth/login', () => {
    it('should register a new user and return a JWT for a valid code', async () => {
      const testCode = 'newusercode';
      const mockOpenId = `mock_openid_${testCode}`;

      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { openid: mockOpenId, session_key: 'some_key' },
      });

      const res = await request(app).post('/api/auth/login').send({ code: testCode });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('openid', mockOpenId);

      expect(mockJwtSign).toHaveBeenCalledWith({ id: expect.any(Number) }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });
      // 验证 token 结构
      expect(res.body.token).toMatch(/^mock_token_/);
      expect(UserModel.create).toHaveBeenCalledWith(mockOpenId); // 应该创建新用户
    });

    it('should login an existing user and return a JWT', async () => {
      const testCode = 'existingusercode';
      const existingOpenId = 'existing_openid';

      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { openid: existingOpenId, session_key: 'some_key' },
      });

      const res = await request(app).post('/api/auth/login').send({ code: testCode });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('openid', existingOpenId);

      expect(mockJwtSign).toHaveBeenCalledWith({ id: 2 }, process.env.JWT_SECRET, { expiresIn: '7d' });
    });

    it('should return 400 if code is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Code is required');
    });

    it('should return 400 if WeChat login fails', async () => {
      const testCode = 'failedwechatcode';
      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { errcode: 40029, errmsg: 'invalid code' },
      });

      const res = await request(app).post('/api/auth/login').send({ code: testCode });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'WeChat login failed');
    });
  });

  describe('GET /api/protected', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/protected');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized: No token provided');
    });

    it('should return 403 if an invalid token is provided', async () => {
      // 提供一个明显无效的 mock token
      const res = await request(app).get('/api/protected').set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'Forbidden: Invalid or expired token');
      expect(authenticateToken).toHaveBeenCalled(); // 验证中间件被调用
    });

    it('should return 200 and user data if a valid token is provided', async () => {
      const userId = 1;
      // 生成一个符合 mockJwtSign 格式的 token
      const validMockToken = `mock_token_${JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + 3600 })}`;

      const res = await request(app).get('/api/protected').set('Authorization', `Bearer ${validMockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', `Access granted for user ${userId}`);
      expect(authenticateToken).toHaveBeenCalled(); // 验证中间件被调用
    });
  });
});
