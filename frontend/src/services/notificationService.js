import api from './api';

export const notificationService = {
  getUserNotifications: async (page = 0, size = 10) => {
    const res = await api.get('/notifications', { params: { page, size } });
    return res.data;
  },

  getRecentNotifications: async () => {
    const res = await api.get('/notifications/recent');
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data?.unreadCount || 0;
  },

  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res;
  },

  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res;
  },
};
