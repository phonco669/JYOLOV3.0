const { API_BASE } = require('./config.js');

App({
  onLaunch() {
    console.log('API_BASE', API_BASE);
    const token = wx.getStorageSync('auth_token');
    const user = wx.getStorageSync('user_info');
    if (token) {
      this.globalData.token = token;
    }
    if (user) {
      this.globalData.user = user;
    }
    this.login();
  },
  login() {
    wx.login({
      success: res => {
        wx.request({
          url: `${API_BASE}/auth/login`, 
          method: 'POST',
          data: {
            code: res.code
          },
          success: (response) => {
             console.log('Login success', response.data);
             if (response.data.token) {
                 this.globalData.token = response.data.token;
                 this.globalData.user = response.data.user;
                 wx.setStorageSync('auth_token', response.data.token);
                 wx.setStorageSync('user_info', response.data.user);
                 
                 if (this.userLoginCallback) {
                   this.userLoginCallback(response.data.user);
                 }
             }
          },
          fail: (err) => {
              console.error('Login request failed', err);
          }
        })
      }
    })
  },
  getAuthHeader() {
    const token = this.globalData.token || wx.getStorageSync('auth_token');
    if (!token) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  },
  globalData: {
    userInfo: null,
    token: null,
    user: null
  }
})
