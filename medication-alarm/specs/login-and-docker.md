# 规格说明书：微信登录修复与 Docker 部署升级

## 1. 目标 (Goals)
- 修复微信登录时无法显示昵称/头像的问题。
- 确保阿里云数据库上的历史用户数据可查（解决 Mock OpenID 与真实 OpenID 混淆的问题）。
- 提供一键 Docker 部署与升级功能。

## 2. 问题定义 (Problem Statement)
### 2.1 微信登录信息展示 (Bug #1)
- **现状**：前端 `getUserProfile` 仅更新本地 `displayName`，未将昵称和头像持久化到后端。后端 `UserModel` 缺少昵称和头像字段。
- **预期**：用户授权后，昵称和头像应保存到数据库，且每次登录能从后端拉取。

### 2.2 历史数据无法访问 (Bug #2)
- **现状**：后端 `authController.ts` 在 `WECHAT_APP_ID` 缺失时会自动切换到 `mock_openid_${code}`。线上环境如果环境变量配置不正确或 `code` 变化，生成的 `openid` 每次都不同，导致无法关联到历史记录。
- **预期**：明确环境配置要求，确保生产环境强制使用真实 OpenID，并提供数据迁移/修复建议。

### 2.3 部署升级 (New Feature #1)
- **现状**：目前使用 `deploy_to_aliyun.sh` 手动部署到 PM2。
- **预期**：提供 `Dockerfile` 和 `docker-compose.yml`，支持后端容器化。

## 3. 技术方案 (Technical Solution)
### 3.1 数据库方案 (Database)
- 在 `users` 表中增加 `nickname` (TEXT) 和 `avatar_url` (TEXT) 字段。
- 修改 `UserModel.create` 和 `UserModel.findByOpenId` 适配新字段。

### 3.2 登录逻辑 (Auth Flow)
- **前端**：`getUserProfile` 后，调用后端新增接口（或在登录时携带）更新用户信息。
- **后端**：
    - `POST /auth/login`：不仅返回 `token`，还返回完整的 `user` 对象。
    - 增加 `PUT /auth/user` 接口，用于更新昵称和头像。
    - **环境校验**：如果处于生产模式且缺失微信配置，应报错而非降级到 Mock，防止数据混乱。

### 3.3 Docker 化 (Containerization)
- **Dockerfile**：基于 Node.js 18 的多阶段构建。
- **docker-compose.yml**：编排后端服务和持久化卷（用于 SQLite 数据库）。
- **环境变量**：通过 `.env` 文件或 Docker Secrets 注入。

## 4. 验证标准 (Acceptance Criteria)
- [ ] 首次登录后，修改昵称/头像能同步到数据库。
- [ ] 重新打开小程序，能自动加载已保存的昵称和头像。
- [ ] 生产环境下，若微信配置错误，登录应有明确错误提示而非生成临时账户。
- [ ] 使用 `docker-compose up -d` 能启动完整的后端服务，且数据库数据在容器重启后不丢失。
