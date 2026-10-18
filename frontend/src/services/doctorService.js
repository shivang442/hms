import api from './api';

export const doctorService = {
  searchDoctors: async (params = {}) => {
    const res = await api.get('/doctors', { params });
    return res.data;
  },

  getDoctorById: async (id) => {
    const res = await api.get(`/doctors/${id}`);
    return res.data;
  },

  getSpecializations: async () => {
    const res = await api.get('/doctors/specializations');
    return res.data;
  },

  getMyDoctorProfile: async () => {
    const res = await api.get('/doctors/profile/me');
    return res.data;
  },

  createDoctor: async (data) => {
    const res = await api.post('/doctors', data);
    return res.data;
  },

  updateDoctor: async (id, data) => {
    const res = await api.put(`/doctors/${id}`, data);
    return res.data;
  },

  deactivateDoctor: async (id) => {
    const res = await api.patch(`/doctors/${id}/deactivate`);
    return res;
  },

  activateDoctor: async (id) => {
    const res = await api.patch(`/doctors/${id}/activate`);
    return res;
  },
};
