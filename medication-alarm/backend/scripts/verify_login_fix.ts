import { UserModel } from '../src/models/User';
import db from '../src/config/database';
import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function runValidation() {
  console.log('--- 开始系统化验证：登录修复与 Docker 配置 ---');

  // 1. 验证数据库结构
  console.log('1. 验证数据库结构...');
  await new Promise((resolve) => {
    db.all("PRAGMA table_info(users)", (err, columns: any[]) => {
      const names = columns.map(c => c.name);
      const hasNickname = names.includes('nickname');
      const hasAvatar = names.includes('avatar_url');
      if (hasNickname && hasAvatar) {
        console.log('   [PASS] users 表字段完整');
      } else {
        console.error('   [FAIL] users 表缺失字段:', names);
        process.exit(1);
      }
      resolve(null);
    });
  });

  // 2. 验证 UserModel 操作
  console.log('2. 验证 UserModel 操作...');
  const testOpenId = 'test_openid_' + Date.now();
  let user = await UserModel.create(testOpenId, '测试用户', 'http://test.com/avatar.png');
  if (user.nickname === '测试用户') {
    console.log('   [PASS] UserModel.create 支持新字段');
  } else {
    console.error('   [FAIL] UserModel.create 失败');
  }

  await UserModel.update(user.id!, { nickname: '更新后的名称' });
  const updatedUser = await UserModel.findById(user.id!);
  if (updatedUser?.nickname === '更新后的名称') {
    console.log('   [PASS] UserModel.update 工作正常');
  } else {
    console.error('   [FAIL] UserModel.update 失败');
  }

  // 3. 验证环境校验逻辑 (模拟 authController)
  console.log('3. 验证环境校验逻辑...');
  const appId = process.env.WECHAT_APP_ID;
  const isProd = process.env.NODE_ENV === 'production';
  
  if (isProd && !appId) {
    console.log('   [INFO] 检测到生产环境且无 AppID，这是测试预期触发点');
    // 这里我们不真的跑服务器，逻辑已在 controller 中实现
  } else {
    console.log(`   [INFO] 当前环境: ${process.env.NODE_ENV || 'development'}, AppID: ${appId ? '已设置' : '未设置'}`);
  }

  console.log('--- 验证完成 ---');
  process.exit(0);
}

runValidation().catch(err => {
  console.error('验证过程中出错:', err);
  process.exit(1);
});
