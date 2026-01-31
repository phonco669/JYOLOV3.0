const app = getApp();
const API_BASE = 'http://localhost:3000/api';

Page({
  data: {
    reminders: [],
    loading: true,
    showModal: false,
    activeTab: 'pending',
    editingId: null,
    newTodo: {
      title: '',
      description: '',
      due_date: '',
      time: ''
    },
    today: new Date().toISOString().split('T')[0]
  },

  onShow() {
    this.fetchReminders();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    
    this.setData({ 
      activeTab: tab, 
      reminders: [], 
      loading: true 
    });
    this.fetchReminders();
  },

  fetchReminders() {
    this.setData({ loading: true });
    
    if (this.data.activeTab === 'pending') {
      wx.request({
        url: `${API_BASE}/reminders`,
        method: 'GET',
        header: { 'x-user-id': '1' },
        success: (res) => {
          if (res.statusCode === 200) {
            this.setData({ reminders: res.data, loading: false });
          }
        },
        fail: (err) => {
          console.error('Fetch reminders failed', err);
          this.setData({ loading: false });
        }
      });
    } else {
      // Fetch completed todos
      wx.request({
        url: `${API_BASE}/todos`,
        method: 'GET',
        header: { 'x-user-id': '1' },
        success: (res) => {
          if (res.statusCode === 200) {
            const completed = res.data
              .filter(t => t.status === 'completed')
              .map(t => ({
                id: `todo-${t.id}`,
                type: 'todo',
                title: t.title,
                detail: t.description,
                due_time: t.due_date,
                priority: 'low'
              }));
            this.setData({ reminders: completed, loading: false });
          }
        },
        fail: () => {
          this.setData({ loading: false });
        }
      });
    }
  },

  openAddModal() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    
    this.setData({
      showModal: true,
      editingId: null,
      newTodo: {
        title: '',
        description: '',
        due_date: dateStr,
        time: timeStr
      }
    });
  },

  closeModal() {
    this.setData({ showModal: false, editingId: null });
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`newTodo.${field}`]: value
    });
  },

  editTodo(e) {
    const item = e.currentTarget.dataset.item;
    // item.id format "todo-123"
    const id = item.id.split('-')[1];
    
    // Parse due_time "YYYY-MM-DD HH:MM"
    let date = this.data.today;
    let time = '12:00';
    
    if (item.due_time && item.due_time.includes(' ')) {
      [date, time] = item.due_time.split(' ');
    }

    this.setData({
      showModal: true,
      editingId: id,
      newTodo: {
        title: item.title,
        description: item.detail,
        due_date: date,
        time: time
      }
    });
  },

  submitTodo() {
    const { title, description, due_date, time } = this.data.newTodo;
    if (!title) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }

    const dateTime = `${due_date} ${time}`;
    const isEdit = !!this.data.editingId;
    const url = isEdit ? `${API_BASE}/todos/${this.data.editingId}` : `${API_BASE}/todos`;
    const method = isEdit ? 'PUT' : 'POST';

    wx.request({
      url: url,
      method: method,
      header: { 'x-user-id': '1' },
      data: {
        title,
        description,
        due_date: dateTime,
        type: 'custom'
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.showToast({ title: isEdit ? '修改成功' : '添加成功' });
          this.closeModal();
          this.fetchReminders();
        } else {
            wx.showToast({ title: '操作失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  markDone(e) {
      const id = e.currentTarget.dataset.id;
      const type = e.currentTarget.dataset.type;
      
      if (type === 'todo') {
          const todoId = id.split('-')[1];
          wx.request({
              url: `${API_BASE}/todos/${todoId}/status`,
              method: 'PUT',
              data: { status: 'completed' },
              success: () => {
                  wx.showToast({ title: '已完成' });
                  this.fetchReminders();
              }
          });
      }
  },

  undoComplete(e) {
      const id = e.currentTarget.dataset.id;
      // id format "todo-123"
      const todoId = id.split('-')[1];
      
      wx.request({
          url: `${API_BASE}/todos/${todoId}/status`,
          method: 'PUT',
          data: { status: 'pending' },
          success: () => {
              wx.showToast({ title: '已恢复' });
              this.fetchReminders();
          }
      });
  }
});
