import api from './api';

export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getAuditLogs: async (page = 0, size = 15) => {
    const res = await api.get('/admin/audit-logs', { params: { page, size } });
    return res.data;
  },

  getUsers: async (role = null, page = 0, size = 15) => {
    const params = { page, size };
    if (role) params.role = role;
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  toggleUserStatus: async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/toggle-status`);
    return res.data;
  },
};
