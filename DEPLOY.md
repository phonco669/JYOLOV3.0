# 阿里云部署指南 (Deployment to Aliyun)

## 1. 准备工作 (Prerequisites)

### 阿里云服务 (Aliyun Services)
1. **ECS 实例 (ECS Instance)**
   - 推荐配置: 2核 4G (2 vCPU, 4GB RAM)
   - 操作系统: Ubuntu 22.04 LTS 或 CentOS 7+
   - 公网 IP (Public IP): 需要

2. **RDS 数据库 (Optional)**
   - 如果不使用 ECS 本地 SQLite/Postgres，可购买 RDS PostgreSQL。
   - 对于本项目 MVP，使用 ECS 本地 SQLite 即可。

3. **域名 (Domain Name)**
   - 微信小程序要求后端必须使用 HTTPS。
   - 需要一个已备案的域名。
   - SSL 证书 (可使用阿里云免费 SSL 证书)。

### 本地开发环境 (Local Dev)
- 确保代码在本地 `npm run dev` 运行无误。
- 确保 `backend/package.json` 中的 `scripts` 包含 build 命令。

## 2. 后端部署 (Backend Deployment)

### 步骤 1: 环境配置 (Environment Setup)
SSH 连接到 ECS:
```bash
ssh root@your-ecs-ip
```

安装 Node.js (v18+):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

安装 PM2 (进程管理):
```bash
npm install -g pm2
```

### 步骤 2: 代码上传 (Code Upload)
可以使用 `git` 或 `scp`。推荐使用 Git。

```bash
git clone <your-repo-url>
cd medication-alarm/backend
```

### 步骤 3: 安装依赖与构建 (Install & Build)
```bash
npm install
npm run build
```
*(注意: 确保 `tsconfig.json` 配置正确，通常编译到 `dist` 目录)*

### 步骤 4: 环境变量 (Env Vars)
创建 `.env` 文件:
```bash
nano .env
```
内容:
```env
PORT=3000
# 生产环境微信凭证
WECHAT_APP_ID=your_real_app_id
WECHAT_APP_SECRET=your_real_secret
# 数据库路径 (如果使用 SQLite)
DATABASE_URL=./medication.sqlite
```

### 步骤 5: 启动服务 (Start Service)
```bash
pm2 start dist/app.js --name "medication-backend"
pm2 save
pm2 startup
```

### 步骤 6: Nginx 反向代理与 HTTPS (Nginx & HTTPS)
安装 Nginx:
```bash
sudo apt-get install nginx
```

配置 Nginx (`/etc/nginx/sites-available/default`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
重启 Nginx:
```bash
sudo systemctl restart nginx
```

## 3. 小程序前端部署 (Frontend Deployment)

### 步骤 1: 修改 API 地址
在 `frontend/app.js` 或 `config.js` 中，将 `API_BASE` 修改为生产环境域名:
```javascript
const API_BASE = 'https://your-domain.com/api';
```

### 步骤 2: 微信开发者工具上传
1. 打开微信开发者工具。
2. 点击右上角 "上传" (Upload)。
3. 填写版本号 (e.g., 1.0.0) 和备注。

### 步骤 3: 微信公众平台发布
1. 登录 [微信公众平台](https://mp.weixin.qq.com)。
2. 进入 "版本管理"。
3. 选择刚才上传的开发版本，提交审核。
4. 审核通过后，点击 "发布"。

## 4. 交付清单 (Deliverables)

为了完成部署，你需要提供以下信息:
1. **域名**: 已备案的域名。
2. **服务器**: 阿里云 ECS 的 root 密码或 SSH Key。
3. **微信小程序凭证**: AppID 和 AppSecret (在微信公众平台 -> 开发 -> 开发设置)。
4. **SSL 证书**: 域名的 SSL 证书文件 (pem/key)。

---
**注意**: 由于涉及到真实的 AppID 和服务器权限，通常由你 (用户) 完成购买和备案，我提供代码包和上述指南协助你操作。
