const app = getApp()

Page({
  data: {
    dosageMode: 'fixed', // 'fixed' or 'alternate'
    fixedDosage: '',
    fixedDosageIndex: -1,
    alternateDosages: ['', ''], // Start with 2 days
    dosageOptions: [], // Will generate 0.25 - 10.0
    
    colors: [
      { value: '#4CAF50', name: 'Green' },
      { value: '#2196F3', name: 'Blue' },
      { value: '#EF5350', name: 'Red' },
      { value: '#FF9800', name: 'Orange' },
      { value: '#9C27B0', name: 'Purple' },
      { value: '#009688', name: 'Teal' },
      { value: '#795548', name: 'Brown' },
      { value: '#607D8B', name: 'Grey' }
    ],
    selectedColor: '#4CAF50',
    reminderTime: ''
  },

  onLoad() {
    this.generateDosageOptions();
  },

  onTimeChange(e) {
    this.setData({
      reminderTime: e.detail.value
    });
  },

  generateDosageOptions() {
    const options = [];
    for (let i = 0.25; i <= 10; i += 0.25) {
      options.push(i.toString());
    }
    this.setData({ dosageOptions: options });
  },

  setModeFixed() {
    this.setData({ dosageMode: 'fixed' });
  },

  setModeAlternate() {
    this.setData({ dosageMode: 'alternate' });
  },

  toggleDosageMode() {
    // Deprecated, keeping for safety if called elsewhere
    this.setData({
      dosageMode: this.data.dosageMode === 'fixed' ? 'alternate' : 'fixed'
    });
  },

  onFixedDosageChange(e) {
    const index = e.detail.value;
    this.setData({
      fixedDosage: this.data.dosageOptions[index],
      fixedDosageIndex: index
    });
  },

  onAlternateDosageChange(e) {
    const index = e.currentTarget.dataset.index; // Index in alternateDosages array
    const pickerIndex = e.detail.value;
    const val = this.data.dosageOptions[pickerIndex];
    
    const newDosages = [...this.data.alternateDosages];
    newDosages[index] = val;
    
    this.setData({
      alternateDosages: newDosages
    });
  },

  addAlternateStep() {
    this.setData({
      alternateDosages: [...this.data.alternateDosages, '']
    });
  },

  removeAlternateStep(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.alternateDosages.length <= 2) {
      wx.showToast({ title: '至少需要两天', icon: 'none' });
      return;
    }
    const newDosages = this.data.alternateDosages.filter((_, i) => i !== index);
    this.setData({ alternateDosages: newDosages });
  },

  selectColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ selectedColor: color });
  },

  submitForm(e) {
    const { name, unit, stock } = e.detail.value;
    
    // Validation
    if (!name) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' });
      return;
    }

    let finalDosage = '';
    if (this.data.dosageMode === 'fixed') {
      if (!this.data.fixedDosage) {
        wx.showToast({ title: '请选择单次用量', icon: 'none' });
        return;
      }
      finalDosage = this.data.fixedDosage;
    } else {
      if (this.data.alternateDosages.some(d => !d)) {
        wx.showToast({ title: '请完善交替用量', icon: 'none' });
        return;
      }
      finalDosage = this.data.alternateDosages.join(',');
    }

    const userId = app.globalData.user ? app.globalData.user.id : 1;

    wx.request({
      url: 'http://localhost:3000/api/medications',
      method: 'POST',
      header: {
        'x-user-id': userId
      },
      data: {
        name,
        dosage: finalDosage, // Send as string
        unit,
        color: this.data.selectedColor,
        stock: parseFloat(stock) || 0
      },
      success: (res) => {
        if (res.statusCode === 201) {
          const newMedId = res.data.id;

          // If reminder time is set, create a Plan
          if (this.data.reminderTime) {
            wx.request({
              url: 'http://localhost:3000/api/plans',
              method: 'POST',
              header: { 'x-user-id': userId },
              data: {
                medication_id: newMedId,
                time: this.data.reminderTime,
                frequency: 'daily',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '2099-12-31'
              },
              success: (planRes) => {
                wx.showToast({ title: '保存成功' });
                setTimeout(() => { wx.navigateBack(); }, 1500);
              },
              fail: () => {
                wx.showToast({ title: '药品保存成功，提醒设置失败', icon: 'none' });
                setTimeout(() => { wx.navigateBack(); }, 1500);
              }
            });
          } else {
            wx.showToast({ title: '保存成功' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    })
  }
})
