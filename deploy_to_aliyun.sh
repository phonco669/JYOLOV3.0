#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 开始部署 Medication Alarm 后端服务 ===${NC}"

# 1. 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo -e "${RED}未检测到 Node.js，正在安装...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}正在安装 PM2...${NC}"
    npm install -g pm2
fi

# 3. 准备项目目录
PROJECT_DIR="/root/medication-alarm"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${GREEN}项目目录已存在，正在更新代码...${NC}"
    cd "$PROJECT_DIR"
    git fetch --all
    git reset --hard origin/master
else
    echo -e "${GREEN}正在克隆代码...${NC}"
    git clone https://github.com/phonco669/JYOLOV3.0.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 4. 进入后端目录并安装依赖
BACKEND_DIR="$PROJECT_DIR/medication-alarm/backend"
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}错误: 后端目录不存在 ($BACKEND_DIR)${NC}"
    exit 1
fi

cd "$BACKEND_DIR"
echo -e "${GREEN}正在安装依赖...${NC}"
npm install

echo -e "${GREEN}正在编译 TypeScript...${NC}"
npm run build

# 5. 配置环境变量 (如果不存在)
if [ ! -f .env ]; then
    echo -e "${GREEN}创建默认 .env 文件...${NC}"
    echo "PORT=3000" > .env
    echo "DATABASE_URL=./medication.sqlite" >> .env
    # 注意: 这里需要用户后续手动填入真实的 AppID/Secret
fi

# 6. 重启服务
echo -e "${GREEN}正在重启服务...${NC}"
pm2 restart medication-backend 2>/dev/null || pm2 start dist/app.js --name "medication-backend"
pm2 save

# 7. 检查 Nginx 配置 (简单检查)
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}警告: 未检测到 Nginx。请手动安装 Nginx 并配置 HTTPS 转发。${NC}"
else
    echo -e "${GREEN}Nginx 已安装。请确保已配置 /api 转发到 localhost:3000 且 SSL 证书有效。${NC}"
fi

echo -e "${GREEN}=== 部署完成! ===${NC}"
echo -e "请使用 'pm2 list' 查看服务状态。"
