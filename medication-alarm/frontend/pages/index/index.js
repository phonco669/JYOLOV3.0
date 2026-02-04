const { API_BASE } = require('../../config.js');
const app = getApp()

Page({
  data: {
    motto: 'Welcome to Medication Alarm',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
    todayDate: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
    schedule: [],
    stats: {
      pending: 0,
      completed: 0
    },
    runGuide: false,
    guideSteps: []
  },
  
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }

    if (app.globalData.user) {
      this.setData({
        userInfo: app.globalData.user,
        hasUserInfo: true
      })
    } else {
      app.userLoginCallback = res => {
        this.setData({
          userInfo: res,
          hasUserInfo: true
        })
        this.fetchAllData();
      }
    }
  },

  onShow() {
    this.fetchAllData();
    this.checkGuide();
  },

  checkGuide() {
      // Get or initialize guide progress
      let guideProgress = wx.getStorageSync('guide_progress');
      if (!guideProgress) {
          guideProgress = { home_intro: false, med_box_entry: false, med_add_entry: false };
          wx.setStorageSync('guide_progress', guideProgress);
      }

      // If home intro not done, show guide
      if (!guideProgress.home_intro) {
          this.setData({
              runGuide: true,
              guideSteps: [
                  { 
                      target: '#guide-target-1', 
                      content: '点击这里打开药箱，开始添加您的第一款药品。', 
                      placement: 'top'
                  }
              ]
          });
      }
  },

  onGuideComplete() {
      // Mark home intro as done
      let guideProgress = wx.getStorageSync('guide_progress') || {};
      guideProgress.home_intro = true;
      wx.setStorageSync('guide_progress', guideProgress);
      
      this.setData({ runGuide: false });
  },

  fetchAllData() {
    const userId = app.globalData.user ? app.globalData.user.id : 1;
    const header = { 'x-user-id': userId };
    
    // 1. Fetch Schedule
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    wx.request({
      url: `${API_BASE}/plans/daily?date=${today}`,
      header,
      success: (res) => {
        if (res.statusCode === 200) {
            const schedule = res.data;
            const pending = schedule.filter(s => s.status === 'pending').length;
            const completed = schedule.filter(s => s.status === 'taken').length;
            
            // Check overdue (simple check: if pending and time < now)
            const nowTime = now.toTimeString().slice(0, 5);
            const scheduleWithOverdue = schedule.map(item => {
                const isOverdue = item.status === 'pending' && item.time < nowTime;
                return { ...item, isOverdue };
            });

            this.setData({
                schedule: scheduleWithOverdue,
                'stats.pending': pending,
                'stats.completed': completed
            });
        }
      }
    });
  },

  takeMedication(e) {
    const { planId, medicationId } = e.currentTarget.dataset;
    const item = this.data.schedule.find(s => s.plan_id === planId);
    const userId = app.globalData.user ? app.globalData.user.id : 1;

    if (!item) return;

    if (item.status === 'taken') {
        // Undo take (Delete record)
        wx.showModal({
            title: '确认',
            content: '确定要标记为未服药吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.request({
                        url: `${API_BASE}/records/${item.record_id}`,
                        method: 'DELETE',
                        header: { 'x-user-id': userId },
                        success: (res) => {
                            if (res.statusCode === 200) {
                                wx.showToast({ title: '已撤销', icon: 'none' });
                                this.fetchAllData();
                            }
                        }
                    });
                }
            }
        });
    } else {
        // Mark as taken (Create record)
        wx.request({
            url: `${API_BASE}/records`,
            method: 'POST',
            header: {
                'x-user-id': userId,
                'Content-Type': 'application/json'
            },
            data: {
                medication_id: medicationId,
                plan_id: planId,
                taken_at: new Date().toISOString(),
                status: 'taken',
                dosage_taken: parseFloat(item.dosage) || 1
            },
            success: (res) => {
                if (res.statusCode === 201) {
                    wx.showToast({ title: '已服药', icon: 'success' });
                    this.fetchAllData();
                }
            }
        });
    }
  },

  getUserProfile(e) {
    wx.getUserProfile({
      desc: '用于完善会员资料', 
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },

  goToMedications() {
    // Check if we need to continue the guide
    let guideProgress = wx.getStorageSync('guide_progress') || {};
    let url = '../medications/list';
    
    // If med_box_entry (next step) is not done, pass guide=true
    if (!guideProgress.med_box_entry) {
        // Ensure home_intro is marked done just in case
        if (!guideProgress.home_intro) {
            guideProgress.home_intro = true;
            wx.setStorageSync('guide_progress', guideProgress);
        }
        url += '?guide=true';
    }

    wx.navigateTo({
      url: url
    })
  },

  goToAdd() {
    wx.navigateTo({
      url: '../medications/add'
    })
  },
})
