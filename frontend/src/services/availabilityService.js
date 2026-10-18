import api from './api';

export const availabilityService = {
  setAvailability: async (data) => {
    const res = await api.post('/availability', data);
    return res.data;
  },

  getDoctorAvailability: async (doctorId) => {
    const res = await api.get(`/availability/doctor/${doctorId}`);
    return res.data;
  },

  getAvailableSlots: async (doctorId, date) => {
    const res = await api.get(`/availability/doctor/${doctorId}/slots`, {
      params: { date },
    });
    return res.data;
  },
};
