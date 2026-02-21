# 任务计划：微信登录修复与 Docker 部署

## 阶段 1: 数据库与模型升级 (Database & Model)
- [x] 1.1 修改 `backend/src/config/database.ts`：通过 `ALTER TABLE` 为 `users` 表添加 `nickname` 和 `avatar_url` 字段。
- [x] 1.2 更新 `backend/src/models/User.ts`：
    - 更新 `User` 接口。
    - 在 `UserModel.create` 中支持新字段。
    - 增加 `UserModel.update` 方法，用于更新用户信息。

## 阶段 2: 后端接口增强 (Backend API)
- [x] 2.1 修改 `backend/src/controllers/authController.ts`：
    - 在 `login` 方法中，增加对 production 环境缺失配置的校验。
    - 增加 `updateUserInfo` 控制器方法。
- [x] 2.2 更新 `backend/src/routes/authRoutes.ts`：
    - 添加 `PUT /update` 接口，并确保其受 JWT 中间件保护。

## 阶段 3: 前端登录优化 (Frontend UI)
- [x] 3.1 修改 `frontend/pages/index/index.js`：
    - 在 `getUserProfile` 后，调用后端 `PUT /auth/update` 同步信息。
    - 优化登录后数据的本地缓存逻辑。
- [x] 3.2 优化 `app.js` 的 `login` 回调，确保用户数据在全局范围内正确同步。

## 阶段 4: Docker 化与自动化部署 (Containerization & DevOps)
- [x] 4.1 编写 `backend/Dockerfile`。
- [x] 4.2 编写 `backend/docker-compose.yml`。
- [x] 4.3 提供 `backend/.env.docker` 模板。
- [x] 4.4 编写迁移指南，帮助用户将 PM2 部署切换为 Docker 部署。

## 阶段 5: 验证与验收 (Validation)
- [x] 5.1 验证本地登录流完整性（模拟/真实微信环境）。
- [x] 5.2 验证 Docker 环境下数据库持久化。
- [x] 5.3 编写测试用例验证 `updateUserInfo` 接口。
