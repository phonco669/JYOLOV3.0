const app = getApp()
const API_BASE = 'http://localhost:3000/api';

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
    showGuide: false,
    currentStep: 0,
    guideSteps: [
        { title: '管理药箱', desc: '在这里添加和管理您的所有药物，设置库存和颜色。', target: '#guide-target-1' },
        // Add more steps as needed (e.g. schedule item)
    ],
    guidePosition: { top: 0, left: 0 }
  },
  onShow() {
    this.fetchSchedule();
    this.checkGuide();
  },
  checkGuide() {
      const hasShownGuide = wx.getStorageSync('hasShownGuide');
      if (!hasShownGuide) {
          this.setData({ showGuide: true });
          this.updateGuidePosition();
      }
  },
  updateGuidePosition() {
      const step = this.data.guideSteps[this.data.currentStep];
      if (!step) return;

      const query = wx.createSelectorQuery();
      query.select(step.target).boundingClientRect();
      query.exec((res) => {
          if (res[0]) {
              // Calculate position to center the spotlight (simplified)
              // Actually we might just position the text box relative to the target
              // For now, let's just put it near the target
              this.setData({
                  guidePosition: {
                      top: res[0].top,
                      left: res[0].left
                  }
              });
          }
      });
  },
  nextGuideStep() {
      const { currentStep, guideSteps } = this.data;
      if (currentStep < guideSteps.length - 1) {
          this.setData({ currentStep: currentStep + 1 }, () => {
              this.updateGuidePosition();
          });
      } else {
          this.skipGuide();
      }
  },
  skipGuide() {
      this.setData({ showGuide: false });
      wx.setStorageSync('hasShownGuide', true);
  },
  fetchSchedule() {
    const today = new Date().toISOString().split('T')[0];
    wx.request({
      url: `${API_BASE}/plans/schedule?date=${today}`,
      method: 'GET',
      header: {
        'x-user-id': '1' // Mock user ID
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const schedule = res.data;
          const pending = schedule.filter(s => s.status === 'pending').length;
          const completed = schedule.filter(s => s.status === 'taken').length;
          
          this.setData({
            schedule,
            stats: { pending, completed }
          });
        }
      },
      fail: (err) => {
        console.error('Fetch schedule failed', err);
      }
    });
  },
  takeMedication(e) {
    const { planId, medicationId } = e.currentTarget.dataset;
    const item = this.data.schedule.find(s => s.plan_id === planId);
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
                        header: { 'x-user-id': '1' },
                        success: (res) => {
                            if (res.statusCode === 200) {
                                wx.showToast({ title: '已撤销', icon: 'none' });
                                this.fetchSchedule();
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
                'x-user-id': '1',
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
                    this.fetchSchedule();
                }
            }
        });
    }
  },
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  goToMedications() {
    wx.navigateTo({
      url: '../medications/list'
    })
  },
  goToAdd() {
    wx.navigateTo({
      url: '../medications/add'
    })
  },
})
