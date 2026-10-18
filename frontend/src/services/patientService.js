import api from './api';

export const patientService = {
  searchPatients: async (params = {}) => {
    const res = await api.get('/patients', { params });
    return res.data;
  },

  getPatientById: async (id) => {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },

  getMyPatientProfile: async () => {
    const res = await api.get('/patients/profile/me');
    return res.data;
  },

  updatePatient: async (id, data) => {
    const res = await api.put(`/patients/${id}`, data);
    return res.data;
  },
};
