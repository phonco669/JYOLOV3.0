// 生产环境域名 (部署后请修改此处)
const PROD_DOMAIN = 'https://jyolo.com.cn'; 

let API_BASE = `${PROD_DOMAIN}/api`;

try {
  const info = wx.getSystemInfoSync();
  // 如果在开发者工具中，默认连接本地开发环境
  if (info && info.platform === 'devtools') {
    API_BASE = 'http://localhost:3000/api';
  }
} catch (e) {
  console.error('Failed to get system info:', e);
}

module.exports = {
  API_BASE
};
