import client from './client';

export const inventoryItemApi = {
  list: (filters) => client.get('/inventory/items', { params: filters }).then((response) => response.data),
  get: (id) => client.get(`/inventory/items/${id}`).then((response) => response.data),
  create: (payload) => client.post('/inventory/items', payload).then((response) => response.data),
  update: (id, payload) => client.put(`/inventory/items/${id}`, payload).then((response) => response.data),
  remove: (id) => client.delete(`/inventory/items/${id}`),
  history: (id, params) => client.get(`/inventory/items/${id}/history`, { params }).then((response) => response.data),
};

export const inventoryTransactionApi = {
  list: (filters) => client.get('/inventory/transactions', { params: filters }).then((response) => response.data),
  receive: (payload) => client.post('/inventory/transactions/receive', payload).then((response) => response.data),
  issue: (payload) => client.post('/inventory/transactions/issue', payload).then((response) => response.data),
  returnStock: (payload) => client.post('/inventory/transactions/return', payload).then((response) => response.data),
  transfer: (payload) => client.post('/inventory/transactions/transfer', payload).then((response) => response.data),
  adjust: (payload) => client.post('/inventory/transactions/adjust', payload).then((response) => response.data),
};

export const supplierApi = {
  list: (filters) => client.get('/inventory/suppliers', { params: filters }).then((response) => response.data),
  get: (id) => client.get(`/inventory/suppliers/${id}`).then((response) => response.data),
  create: (payload) => client.post('/inventory/suppliers', payload).then((response) => response.data),
  update: (id, payload) => client.put(`/inventory/suppliers/${id}`, payload).then((response) => response.data),
  remove: (id) => client.delete(`/inventory/suppliers/${id}`),
};

export const storageLocationApi = {
  list: () => client.get('/inventory/storage-locations').then((response) => response.data),
  create: (payload) => client.post('/inventory/storage-locations', payload).then((response) => response.data),
};

export const jobCardPartRequestApi = {
  list: (filters) => client.get('/job-card-part-requests', { params: filters }).then((response) => response.data),
  create: (payload) => client.post('/job-card-part-requests', payload).then((response) => response.data),
  approve: (id, payload) => client.post(`/job-card-part-requests/${id}/approve`, payload).then((response) => response.data),
  reject: (id, payload) => client.post(`/job-card-part-requests/${id}/reject`, payload).then((response) => response.data),
  issue: (id) => client.post(`/job-card-part-requests/${id}/issue`).then((response) => response.data),
  returnParts: (id, payload) => client.post(`/job-card-part-requests/${id}/return`, payload).then((response) => response.data),
};

export const inventoryDashboardApi = {
  summary: () => client.get('/inventory/dashboard').then((response) => response.data),
};
