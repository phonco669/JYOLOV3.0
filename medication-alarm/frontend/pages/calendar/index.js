const app = getApp();
const API_BASE = 'http://localhost:3000/api';

Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    days: [],
    statusMap: {},
    selectedDate: null,
    selectedDaySchedule: []
  },

  onShow() {
    // Refresh data on show
    this.fetchStatusAndRender();
  },

  prevMonth() {
    let { year, month } = this.data;
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }
    this.setData({ year, month, selectedDate: null, selectedDaySchedule: [] }, () => {
      this.fetchStatusAndRender();
    });
  },

  nextMonth() {
    let { year, month } = this.data;
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
    this.setData({ year, month, selectedDate: null, selectedDaySchedule: [] }, () => {
      this.fetchStatusAndRender();
    });
  },

  fetchStatusAndRender() {
    const { year, month } = this.data;
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    wx.request({
      url: `${API_BASE}/plans/monthly?start=${start}&end=${end}`,
      header: { 'x-user-id': '1' },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ statusMap: res.data }, () => {
            this.renderDays();
          });
        }
      },
      fail: (err) => {
        console.error('Fetch monthly status failed', err);
        // Render anyway (status will be empty)
        this.renderDays();
      }
    });
  },

  renderDays() {
    const { year, month, statusMap } = this.data;
    const days = [];
    
    // First day of the month
    const firstDate = new Date(year, month - 1, 1);
    const startDayOfWeek = firstDate.getDay(); // 0 (Sun) - 6 (Sat)
    
    // Days in current month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Previous month padding
    const prevMonthDate = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonthDate.getDate();
    
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        days.push({
            dayNum: d,
            isCurrentMonth: false,
            date: '', 
            status: 'none'
        });
    }
    
    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({
            dayNum: i,
            isCurrentMonth: true,
            date: dateStr,
            isToday: dateStr === todayStr,
            status: statusMap[dateStr] || 'none'
        });
    }
    
    // Next month padding
    const remaining = 42 - days.length; // Ensure 6 rows
    for (let i = 1; i <= remaining; i++) {
        days.push({
            dayNum: i,
            isCurrentMonth: false,
            date: '',
            status: 'none'
        });
    }
    
    this.setData({ days });
  },

  onDayClick(e) {
      const date = e.currentTarget.dataset.date;
      if (!date) return;
      
      this.setData({ selectedDate: date });
      this.fetchDailyDetails(date);
  },

  fetchDailyDetails(date) {
      wx.request({
          url: `${API_BASE}/plans/schedule?date=${date}`,
          header: { 'x-user-id': '1' },
          success: (res) => {
              if (res.statusCode === 200) {
                  this.setData({ selectedDaySchedule: res.data });
              }
          }
      });
  }
});