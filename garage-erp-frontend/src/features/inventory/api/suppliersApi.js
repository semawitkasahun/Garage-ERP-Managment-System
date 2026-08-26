import apiClient from '@/services/http/axios';

export const suppliersApi = {
  async list(filters = {}) {
    const { data } = await apiClient.get('/suppliers', { params: filters });
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/suppliers', payload);
    return data;
  },
};