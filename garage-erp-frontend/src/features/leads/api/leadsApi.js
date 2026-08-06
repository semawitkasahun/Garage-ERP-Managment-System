import apiClient from '@/services/http/axios';

export const leadsApi = {
  async list({ search, status, priority, source, page } = {}) {
    const { data } = await apiClient.get('/leads', { params: { search, status, priority, source, page } });
    return data;
  },
  async stats() {
    const { data } = await apiClient.get('/leads/stats');
    return data;
  },
  async get(leadId) {
    const { data } = await apiClient.get(`/leads/${leadId}`);
    return data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/leads', payload);
    return data;
  },
  async update(leadId, payload) {
    const { data } = await apiClient.patch(`/leads/${leadId}`, payload);
    return data;
  },
  async markLost(leadId) {
    const { data } = await apiClient.patch(`/leads/${leadId}/mark-lost`);
    return data;
  },
  async addFollowup(leadId, payload) {
    const { data } = await apiClient.post(`/leads/${leadId}/followups`, payload);
    return data;
  },
  async convert(leadId, payload) {
    const { data } = await apiClient.post(`/leads/${leadId}/convert`, payload ?? {});
    return data;
  },
};