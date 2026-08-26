import apiClient from '@/services/http/axios';

export const checkinsApi = {
  async list({ date, branchId } = {}) {
    const { data } = await apiClient.get('/checkins', { params: { date, branch_id: branchId } });
    return data;
  },
  async getForm(appointmentId) {
    const { data } = await apiClient.get(`/checkins/form/${appointmentId}`);
    return data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/checkins', payload);
    return data;
  },
  async get(checkinId) {
    const { data } = await apiClient.get(`/checkins/${checkinId}`);
    return data;
  },
  async update(checkinId, payload) {
    const { data } = await apiClient.patch(`/checkins/${checkinId}`, payload);
    return data;
  },
  async uploadMedia(checkinId, files) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files[]', file));
    const { data } = await apiClient.post(`/checkins/${checkinId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  async uploadSignature(checkinId, signatureDataUrl) {
    const { data } = await apiClient.post(`/checkins/${checkinId}/signature`, { signature: signatureDataUrl });
    return data;
  },
  async createWorkOrder(checkinId, payload) {
    const { data } = await apiClient.post(`/checkins/${checkinId}/work-order`, payload);
    return data;
  },
};
