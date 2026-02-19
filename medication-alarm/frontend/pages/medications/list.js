const { API_BASE } = require('../../config.js');
const app = getApp()

Page({
  data: {
    medications: [],
    runGuide: false,
    guideSteps: []
  },
  
  onLoad(options) {
      if (options && options.guide) {
          this.checkGuide(options.guide);
      }
  },

  onShow() {
    this.fetchMedications();
  },

  checkGuide(guideParam) {
      // Check if user came from Home guide flow
      if (guideParam === 'true') {
          let guideProgress = wx.getStorageSync('guide_progress') || {};
          
          // Only show if not done yet
          if (!guideProgress.med_box_entry) {
              this.setData({
                  runGuide: true,
                  guideSteps: [
                      {
                          target: '#add-med-btn',
                          content: '点击 + 号，录入新药品。',
                          placement: 'bottom',
                          noNext: true
                      }
                  ]
              });
          }
      }
  },

  onGuideComplete() {
      let guideProgress = wx.getStorageSync('guide_progress') || {};
      guideProgress.med_box_entry = true;
      wx.setStorageSync('guide_progress', guideProgress);
      this.setData({ runGuide: false });
  },

  fetchMedications() {
    wx.request({
      url: `${API_BASE}/medications`,
      method: 'GET',
      header: {
        ...app.getAuthHeader()
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ medications: res.data });
        }
      }
    })
  },
  goToAdd() {
    let guideProgress = wx.getStorageSync('guide_progress') || {};
    let url = './add';

    // If med_add_entry (next step) is not done, pass guide=true
    if (!guideProgress.med_add_entry) {
        // Ensure med_box_entry is marked done
        if (!guideProgress.med_box_entry) {
            guideProgress.med_box_entry = true;
            wx.setStorageSync('guide_progress', guideProgress);
        }
        url += '?guide=true';
    }

    wx.navigateTo({
      url: url
    })
  },
  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `./add?id=${id}`
    })
  },

  showActionSheet(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    
    wx.vibrateShort(); // Feedback
    
    wx.showActionSheet({
      itemList: ['删除药品'],
      itemColor: '#FF3B30', // Red color for delete
      success: (res) => {
        if (res.tapIndex === 0) {
          this.deleteMedication(id, name);
        }
      }
    });
  },

  deleteMedication(id, name) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除 "${name}" 吗？`,
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${API_BASE}/medications/${id}`,
            method: 'DELETE',
            header: app.getAuthHeader(),
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({ title: '已删除' });
                this.fetchMedications(); // Refresh list
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          })
        }
      }
    })
  }
})
