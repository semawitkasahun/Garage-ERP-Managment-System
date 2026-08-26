import apiClient from '@/services/http/axios';

export const inventoryApi = {
  // Parts & Consumables
  async listItems({ search, category, status, location, supplier, page } = {}) {
    const { data } = await apiClient.get('/inventory/items', {
      params: { search, category, status, location, supplier, page },
    });
    return data;
  },

  async getItem(itemId) {
    const { data } = await apiClient.get(`/inventory/items/${itemId}`);
    return data;
  },

  async createItem(payload) {
    const { data } = await apiClient.post('/inventory/items', payload);
    return data;
  },

  async updateItem(itemId, payload) {
    const { data } = await apiClient.patch(`/inventory/items/${itemId}`, payload);
    return data;
  },

  async itemHistory(itemId) {
    const { data } = await apiClient.get(`/inventory/items/${itemId}/history`);
    return data;
  },

  // Controlled stock transactions -- quantity is never edited directly.
  async receiveStock(payload) {
    const { data } = await apiClient.post('/inventory/transactions/receive', payload);
    return data;
  },

  async issueStock(payload) {
    const { data } = await apiClient.post('/inventory/transactions/issue', payload);
    return data;
  },

  async returnStock(payload) {
    const { data } = await apiClient.post('/inventory/transactions/return', payload);
    return data;
  },

  async transferStock(payload) {
    const { data } = await apiClient.post('/inventory/transactions/transfer', payload);
    return data;
  },

  async adjustStock(payload) {
    const { data } = await apiClient.post('/inventory/transactions/adjust', payload);
    return data;
  },

  // Dashboard
  async dashboard() {
    const { data } = await apiClient.get('/inventory/dashboard');
    return data;
  },

  // Dropdown sources
  async suppliers() {
    const { data } = await apiClient.get('/inventory/suppliers');
    return data;
  },

  async storageLocations() {
    const { data } = await apiClient.get('/inventory/storage-locations');
    return data;
  },

  // Pending technician equipment requests (dashboard widget)
  async pendingEquipmentRequests() {
    const { data } = await apiClient.get('/equipment/requests', {
      params: { status: 'pending' },
    });
    return data;
  },

  async approveEquipmentRequest(requestId, payload) {
    const { data } = await apiClient.patch(`/equipment/requests/${requestId}/approve`, payload);
    return data;
  },

  async rejectEquipmentRequest(requestId, payload) {
    const { data } = await apiClient.patch(`/equipment/requests/${requestId}/reject`, payload);
    return data;
  },
};