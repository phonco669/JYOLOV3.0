const { API_BASE } = require('./config.js');

App({
  onLaunch() {
    this.login();
  },
  login() {
    // In a real WeChat environment, wx.login gets a code from WeChat servers.
    // For local dev without WeChat IDE, we might mock this or expect it to fail if run in node.
    // But since this file is for the Mini Program, we write standard MP code.
    wx.login({
      success: res => {
        // Send the code to your backend with an HTTP request
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
  globalData: {
    userInfo: null,
    token: null,
    user: null
  }
})
