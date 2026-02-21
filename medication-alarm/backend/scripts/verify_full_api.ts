import axios from 'axios';
import jwt from 'jsonwebtoken';
import { UserModel } from '../src/models/User';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const API_BASE = 'http://localhost:3000/api';

async function testFullFlow() {
  console.log('--- 开始 API 全流程验证 ---');

  try {
    // 1. 手动创建一个测试用户并生成 Token (模拟已登录状态)
    console.log('1. 准备测试用户和 Token...');
    const testOpenId = 'verify_flow_' + Date.now();
    const user = await UserModel.create(testOpenId, '初始昵称', 'http://old-avatar.com');
    
    const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_fallback';
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });
    const authHeader = { Authorization: `Bearer ${token}` };

    // 2. 测试用户信息更新接口
    console.log('2. 测试 PUT /api/auth/update ...');
    const updateRes = await axios.put(`${API_BASE}/auth/update`, {
      nickname: '新昵称',
      avatar_url: 'http://new-avatar.com/1.png'
    }, { headers: authHeader });

    if (updateRes.status === 200 && updateRes.data.user.nickname === '新昵称') {
      console.log('   [PASS] 信息更新成功');
    } else {
      console.error('   [FAIL] 信息更新失败:', updateRes.data);
    }

    // 3. 从数据库直接验证数据持久化
    const dbUser = await UserModel.findById(user.id!);
    if (dbUser?.nickname === '新昵称' && dbUser?.avatar_url === 'http://new-avatar.com/1.png') {
      console.log('   [PASS] 数据库持久化验证通过');
    } else {
      console.error('   [FAIL] 数据库数据不匹配');
    }

    console.log('--- API 验证完成 ---');
  } catch (err: any) {
    console.error('验证过程中发生错误:', err.response?.data || err.message);
  }
  process.exit(0);
}

testFullFlow();
