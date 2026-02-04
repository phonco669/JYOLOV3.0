const { API_BASE } = require('../../config.js');
const app = getApp();

Page({
  data: {
    stats: null,
    loading: true,
    toView: '',
    rangeType: '30days', // 30days, year, custom
    startDate: '',
    endDate: '',
    showFilter: false,
    filterLabel: '近30天'
  },

  onShow() {
    this.fetchStats();
  },

  onReady() {
      this.checkAndRunGuide();
  },

  toggleFilter() {
      this.setData({ showFilter: !this.data.showFilter });
  },

  selectRange(e) {
      const type = e.currentTarget.dataset.type;
      let startDate = '';
      let endDate = '';
      let label = '';
      const today = new Date().toISOString().split('T')[0];

      if (type === '30days') {
          label = '近30天';
      } else if (type === 'year') {
          startDate = `${new Date().getFullYear()}-01-01`;
          endDate = today;
          label = '本年';
      }

      this.setData({ 
          rangeType: type, 
          startDate, 
          endDate, 
          showFilter: type === 'custom', // Keep open for custom, close for others
          filterLabel: label
      });
      
      if (type !== 'custom') {
          this.fetchStats();
      }
  },

  onStartDateChange(e) {
      this.setData({ startDate: e.detail.value });
  },

  onEndDateChange(e) {
      this.setData({ endDate: e.detail.value });
  },

  applyCustomFilter() {
      if (!this.data.startDate || !this.data.endDate) {
          wx.showToast({ title: '请选择日期范围', icon: 'none' });
          return;
      }
      this.setData({ 
          rangeType: 'custom', 
          showFilter: false,
          filterLabel: `${this.data.startDate} 至 ${this.data.endDate}`
      });
      this.fetchStats();
  },

  fetchStats() {
    this.setData({ loading: true });
    
    let url = `${API_BASE}/statistics/adherence`;
    if (this.data.rangeType !== '30days') {
        const start = this.data.startDate;
        const end = this.data.endDate || new Date().toISOString().split('T')[0];
        url += `?startDate=${start}&endDate=${end}`;
    }

    wx.request({
      url: url,
      method: 'GET',
      header: { 'x-user-id': app.globalData.user ? app.globalData.user.id : 1 },
      success: (res) => {
        if (res.statusCode === 200) {
          // Process data for charts
          const stats = res.data;
          // Format percentage
          stats.overview.percentage = Math.round(stats.overview.adherenceRate * 100);
          
          // Process Body State Data for Visualization (e.g. max weight for scaling)
          if (stats.bodyStates && stats.bodyStates.length > 0) {
             const weights = stats.bodyStates.map(s => s.weight).filter(w => w > 0);
             const maxWeight = Math.max(...weights, 100); // Default max 100kg if empty
             
             stats.bodyStates = stats.bodyStates.map(s => ({
                 ...s,
                 displayDate: s.record_date.split('-').slice(1).join('/'),
                 weightHeight: (s.weight / maxWeight) * 100
             }));
          }

          // Find max for bar chart scaling
          const maxVal = Math.max(...stats.daily.map(d => d.expected));
          
          stats.daily = stats.daily.map(d => ({
            ...d,
            displayDate: d.date.split('-').slice(1).join('/'), // MM/DD
            height: maxVal > 0 ? (d.taken / maxVal) * 100 : 0, // Height percentage
            isPerfect: d.taken >= d.expected && d.expected > 0
          }));

          this.setData({ stats, loading: false }, () => {
              // Auto scroll to the end
              if (stats.daily.length > 0) {
                  this.setData({ toView: `day-${stats.daily.length - 1}` });
              }
          });
        }
      },
      fail: (err) => {
        console.error(err);
        this.setData({ loading: false });
      }
    });
  },

  checkAndRunGuide() {
      const guideShown = wx.getStorageSync('guide_stats_shown');
      if (!guideShown) {
          wx.setStorageSync('guide_stats_shown', true);
          // Wait for render
          setTimeout(() => {
              this.runGuide();
          }, 1000);
      }
  },

  runGuide() {
      const spotlight = this.selectComponent('#spotlight');
      if (spotlight) {
          spotlight.setStep({
              target: '#stats-overview',
              content: '这里显示您的服药完成率和概览数据。',
              position: 'bottom',
              noNext: true
          });
      }
  },

  exportPDF() {
    wx.showLoading({ title: '生成报告中...' });
    
    wx.downloadFile({
      url: `${API_BASE}/statistics/export`,
      header: { 'x-user-id': app.globalData.user ? app.globalData.user.id : 1 },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const filePath = res.tempFilePath;
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: function () {
              console.log('打开文档成功');
            },
            fail: function(err) {
                console.error('Open document failed', err);
                wx.showToast({ title: '无法打开文档', icon: 'none' });
            }
          });
        } else {
            wx.showToast({ title: '导出失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('Download failed', err);
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  }
});
