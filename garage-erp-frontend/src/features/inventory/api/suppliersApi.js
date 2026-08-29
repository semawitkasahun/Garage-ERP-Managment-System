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

  async getById(id) {
    const { data } = await apiClient.get(`/suppliers/${id}`);
    return data;
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/suppliers/${id}`, payload);
    return data;
  },

  async getSupplierPurchases(id) {
    const { data } = await apiClient.get(`/suppliers/${id}/purchases`);
    return data;
  },
};