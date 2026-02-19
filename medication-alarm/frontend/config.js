let API_BASE = 'http://192.168.1.36:3000/api';
try {
  const info = wx.getSystemInfoSync();
  if (info && info.platform === 'devtools') {
    API_BASE = 'http://localhost:3000/api';
  }
} catch (e) {}

module.exports = {
  API_BASE
};
