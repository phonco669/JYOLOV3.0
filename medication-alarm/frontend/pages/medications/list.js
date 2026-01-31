const app = getApp()

Page({
  data: {
    medications: []
  },
  onShow() {
    this.fetchMedications();
  },
  fetchMedications() {
    const token = app.globalData.token; // In real app, use token for auth
    const userId = app.globalData.user ? app.globalData.user.id : 1; // Fallback for dev if auth flow incomplete

    wx.request({
      url: 'http://localhost:3000/api/medications',
      method: 'GET',
      header: {
        'x-user-id': userId // Sending userId in header as per backend controller
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ medications: res.data });
        }
      }
    })
  },
  goToAdd() {
    wx.navigateTo({
      url: './add'
    })
  }
})
