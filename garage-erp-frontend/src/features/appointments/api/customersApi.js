import apiClient from '@/services/http/axios';

export const customersApi = {
  async list({ search, page } = {}) {
    const { data } = await apiClient.get('/customers', { params: { search, page } });
    return data;
  },
  async stats(branchId) {
    const { data } = await apiClient.get('/customers/stats', { params: { branch_id: branchId } });
    return data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/customers', payload);
    return data;
  },
  async remove(customerId) {
    const { data } = await apiClient.delete(`/customers/${customerId}`);
    return data;
  },
};