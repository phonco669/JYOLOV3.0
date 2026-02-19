const { API_BASE } = require('../../config.js');
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
    reminderTime: '',
    startDate: new Date().toISOString().split('T')[0],
    isEditing: false,
    medId: null,
    name: '',
    unit: '',
    stock: '',
    guideStep: 0
  },

  onLoad(options) {
    this.generateDosageOptions();
    if (options && options.id) {
        this.setData({ isEditing: true, medId: options.id });
        wx.setNavigationBarTitle({ title: '修改药品' });
        this.fetchMedicationDetails(options.id);
    }
    
    if (options && options.guide === 'true') {
        this.setData({ shouldRunGuide: true });
    }
  },

  onReady() {
      if (this.data.shouldRunGuide) {
          setTimeout(() => {
              this.runGuideStep(0);
          }, 1000);
      }
  },

  runGuideStep(step) {
      const spotlight = this.selectComponent('#spotlight');
      if (!spotlight) return;

      this.setData({ guideStep: step });

      switch (step) {
          case 0:
              spotlight.setStep({
                  target: '#med-name-group',
                  content: '第一步：输入药品名称，如“优甲乐”。',
                  position: 'bottom'
              });
              break;
          case 1:
              spotlight.setStep({
                  target: '#med-dosage-group',
                  content: '第二步：设置用量。可以选择固定用量或交替用量（隔天不同剂量）。',
                  position: 'bottom'
              });
              break;
          case 2:
              spotlight.setStep({
                  target: '#med-time-group',
                  content: '第三步：设置提醒时间，到点我们会准时提醒您服药。',
                  position: 'top'
              });
              break;
          case 3:
              spotlight.setStep({
                  target: '#med-submit-btn',
                  content: '最后，点击保存即可完成添加！',
                  position: 'top',
                  noNext: true
              });
              break;
      }
  },

  onGuideNext() {
      const nextStep = this.data.guideStep + 1;
      if (nextStep < 4) {
          this.runGuideStep(nextStep);
      } else {
          const spotlight = this.selectComponent('#spotlight');
          spotlight.dismiss();
          
          // Mark guide as done
          let guideProgress = wx.getStorageSync('guide_progress') || {};
          guideProgress.med_add_entry = true;
          wx.setStorageSync('guide_progress', guideProgress);
      }
  },

  fetchMedicationDetails(id) {
      wx.request({
          url: `${API_BASE}/medications/${id}`,
          header: app.getAuthHeader(),
          success: (res) => {
              if (res.statusCode === 200) {
                  const med = res.data;
                  // Parse dosage
                  let mode = 'fixed';
                  let fixed = '';
                  let alternate = ['', ''];
                  
                  const dosageStr = String(med.dosage); // Ensure string
                  
                  if (dosageStr.includes(',')) {
                      mode = 'alternate';
                      alternate = dosageStr.split(',');
                  } else {
                      fixed = dosageStr;
                  }

                  // Find index for fixed dosage
                  const fixedIndex = this.data.dosageOptions.indexOf(fixed);

                  this.setData({
                      name: med.name,
                      unit: med.unit,
                      stock: med.stock.toString(),
                      selectedColor: med.color,
                      dosageMode: mode,
                      fixedDosage: fixed,
                      fixedDosageIndex: fixedIndex,
                      alternateDosages: alternate,
                      // reminderTime: '' // Don't reset here, fetch plan next
                  });

                  // Fetch Plan for this medication
                  wx.request({
                      url: `${API_BASE}/plans/medication/${id}`,
                      header: app.getAuthHeader(),
                      success: (planRes) => {
                          if (planRes.statusCode === 200 && planRes.data.length > 0) {
                              const plan = planRes.data[0]; // Assuming 1 plan per med for now
                              this.setData({
                                  reminderTime: plan.time,
                                  startDate: plan.start_date,
                                  planId: plan.id // Store planId for updates
                              });
                          }
                      }
                  });
              }
          }
      })
  },

  onStartDateChange(e) {
    this.setData({
      startDate: e.detail.value
    });
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

    // Determine if we are creating or updating
    const isEditing = this.data.isEditing;
    const medId = this.data.medId;
    
    const url = isEditing 
      ? `${API_BASE}/medications/${medId}` 
      : `${API_BASE}/medications`;
    
    const method = isEditing ? 'PUT' : 'POST';

    wx.request({
      url: url,
      method: method,
      header: {
        ...app.getAuthHeader()
      },
      data: {
        name,
        dosage: finalDosage, // Send as string
        unit,
        color: this.data.selectedColor,
        stock: parseFloat(stock) || 0
      },
      success: (res) => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          const targetMedId = isEditing ? medId : res.data.id;

          // If reminder time is set, create or update Plan
          if (this.data.reminderTime) {
            
            // Determine Plan action
            let planUrl = `${API_BASE}/plans`;
            let planMethod = 'POST';
            
            if (isEditing && this.data.planId) {
                planUrl = `${API_BASE}/plans/${this.data.planId}`;
                planMethod = 'PUT';
            }

            wx.request({
              url: planUrl,
              method: planMethod,
              header: app.getAuthHeader(),
              data: {
                medication_id: targetMedId,
                time: this.data.reminderTime,
                frequency: 'daily',
                start_date: this.data.startDate,
                end_date: '2099-12-31'
              },
              success: (planRes) => {
                // 请求订阅并在本地调度一次最近的提醒
                try {
                  const { scheduleMedicationReminder } = require('../../utils/subscription.js');
                  // 计算下一次提醒时间（如果今天该时间已过，则约到明天）
                  const now = new Date();
                  const todayStr = now.toISOString().split('T')[0];
                  const nextDate = (() => {
                    if (this.data.startDate > todayStr) return this.data.startDate;
                    const hhmm = this.data.reminderTime;
                    const nowHM = now.toTimeString().slice(0,5);
                    return (hhmm > nowHM) ? todayStr : new Date(now.getTime() + 86400000).toISOString().split('T')[0];
                  })();
                  scheduleMedicationReminder({
                    name,
                    dosage: this.data.dosageMode === 'fixed' ? this.data.fixedDosage : this.data.alternateDosages.join(','),
                    unit,
                    stock: parseFloat(stock) || 0,
                    date: nextDate,
                    time: this.data.reminderTime
                  });
                } catch (err) {
                  console.warn('scheduleMedicationReminder failed or skipped', err);
                }
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
      },
      fail: (err) => {
        console.error('Save medication failed', err);
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    })
  }
})
