import api from './api';

export const appointmentService = {
  bookAppointment: async (data) => {
    const res = await api.post('/appointments', data);
    return res.data;
  },

  getAppointments: async (params = {}) => {
    const res = await api.get('/appointments', { params });
    return res.data;
  },

  getAppointmentById: async (id) => {
    const res = await api.get(`/appointments/${id}`);
    return res.data;
  },

  updateStatus: async (id, status, reason = '') => {
    const res = await api.patch(`/appointments/${id}/status`, { status, reason });
    return res.data;
  },

  getDoctorDailySchedule: async (doctorId, date) => {
    const res = await api.get(`/appointments/doctor/${doctorId}/schedule`, {
      params: { date },
    });
    return res.data;
  },
};
