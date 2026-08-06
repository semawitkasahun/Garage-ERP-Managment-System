import apiClient from '@/services/http/axios';

export const customersApi = {
  async list({ search, page } = {}) {
    const { data } = await apiClient.get('/customers', { params: { search, page } });
    return data; // Laravel paginator shape
  },
  async stats(branchId) {
    const { data } = await apiClient.get('/customers/stats', { params: { branch_id: branchId } });
    return data;
  },
  async get(customerId) {
    const { data } = await apiClient.get(`/customers/${customerId}`);
    return data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/customers', payload);
    return data;
  },
  async update(customerId, payload) {
    const { data } = await apiClient.patch(`/customers/${customerId}`, payload);
    return data;
  },
  async remove(customerId) {
    const { data } = await apiClient.delete(`/customers/${customerId}`);
    return data;
  },
};
