import apiClient from '@/services/http/axios';

export const equipmentApi = {
  async list({ search, category, status, page } = {}) {
    const { data } = await apiClient.get('/equipment', { params: { search, category, status, page } });
    return data;
  },

  async lookupByQr(code) {
    const { data } = await apiClient.get(`/equipment/qr/${encodeURIComponent(code)}`);
    return data;
  },

  async technicians() {
    const { data } = await apiClient.get('/technicians');
    // The API now returns employee data with employee_id
    return data;
  },

  async checkout(payload) {
    const { data } = await apiClient.post('/equipment/checkout', payload);
    return data;
  },

  async returnEquipment(payload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'photos' && Array.isArray(value)) {
        value.forEach((file) => formData.append('photos[]', file));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    const { data } = await apiClient.post('/equipment/return', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async accountability(filters = {}) {
    const { data } = await apiClient.get('/equipment/accountability', { params: filters });
    return data;
  },

  async endOfShift() {
    const { data } = await apiClient.get('/equipment/end-of-shift');
    return data;
  },

  async transfer(payload) {
    const { data } = await apiClient.post('/equipment/transfers', payload);
    return data;
  },

  async extendReturn(checkoutId, payload) {
    const { data } = await apiClient.patch(`/equipment/checkouts/${checkoutId}/extend`, payload);
    return data;
  },

  async reportMissing(payload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'photos' && Array.isArray(value)) {
        value.forEach((file) => formData.append('photos[]', file));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    const { data } = await apiClient.post('/equipment/missing-reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async requestEquipment(payload) {
    const { data } = await apiClient.post('/equipment/requests', payload);
    return data;
  },

  async myCheckedOutEquipment() {
    const { data } = await apiClient.get('/equipment/my-checkouts');
    return data;
  },
};