const { API_BASE } = require('../../config.js');
const app = getApp();

Page({
  data: {
    date: new Date().toISOString().split('T')[0],
    symptom: '',
    weight: '',
    note: ''
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onSymptomInput(e) {
    this.setData({ symptom: e.detail.value });
  },

  onWeightInput(e) {
    this.setData({ weight: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  submitForm() {
    const { date, symptom, weight, note } = this.data;
    
    if (!symptom && !weight && !note) {
      wx.showToast({ title: '请至少填写一项内容', icon: 'none' });
      return;
    }

    wx.request({
      url: `${API_BASE}/body-states`,
      method: 'POST',
      header: {
        ...app.getAuthHeader()
      },
      data: {
        date,
        symptom,
        weight,
        note
      },
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({ title: '记录成功' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});
