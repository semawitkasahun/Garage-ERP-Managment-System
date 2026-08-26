import client from './client';

export const equipmentApi = {
  stats: () => client.get('/equipment/stats').then((response) => response.data),
  list: (params) => client.get('/equipment', { params }).then((response) => response.data),
  get: (id) => client.get(`/equipment/${id}`).then((response) => response.data),
  history: (id) => client.get(`/equipment/${id}/history`).then((response) => response.data),
  create: (payload) => client.post('/equipment', payload).then((response) => response.data),
  update: (id, payload) => client.put(`/equipment/${id}`, payload).then((response) => response.data),
  remove: (id) => client.delete(`/equipment/${id}`).then((response) => response.data),
  checkOut: (id, payload) => client.post(`/equipment/${id}/check-out`, payload).then((response) => response.data),
  checkIn: (id, payload) => client.post(`/equipment/${id}/check-in`, payload).then((response) => response.data),
  addMaintenanceLog: (id, payload) => client.post(`/equipment/${id}/maintenance-logs`, payload).then((response) => response.data),
  completeMaintenance: (id) => client.post(`/equipment/${id}/complete-maintenance`).then((response) => response.data),
  regenerateQr: (id) => client.post(`/equipment/${id}/regenerate-qr`).then((response) => response.data),
  extend: (id, payload) => client.post(`/equipment/${id}/extend`, payload).then((response) => response.data),
  accountability: (params) => client.get('/equipment/accountability', { params }).then((response) => response.data),
  reportMissing: (id, payload) => client.post(`/equipment/${id}/report-missing`, payload).then((response) => response.data),
  transfer: (id, payload) => client.post(`/equipment/${id}/transfer`, payload).then((response) => response.data),
  lookupByQr: (token) => client.get(`/equipment/lookup-by-qr/${token}`).then((response) => response.data),
  checkoutLog: (params) => client.get('/equipment/checkout-log', { params }).then((response) => response.data),
  regenerateCheckoutQr: (id) => client.post(`/equipment/${id}/regenerate-checkout-qr`).then((response) => response.data),
  // Fetches QR as authenticated binary blob (avoids cookie/auth issue with plain <img> tags)
  fetchQrBlob: (id, type) => client.get(`/equipment/${id}/qr`, { params: { type }, responseType: 'blob' }).then((r) => r.data),
};

export const equipmentRequestApi = {
  list: (params) => client.get('/equipment-requests', { params }).then((response) => response.data),
  create: (payload) => client.post('/equipment-requests', payload).then((response) => response.data),
  approve: (id, payload) => client.post(`/equipment-requests/${id}/approve`, payload).then((response) => response.data),
  reject: (id, payload) => client.post(`/equipment-requests/${id}/reject`, payload).then((response) => response.data),
  issue: (id, payload) => client.post(`/equipment-requests/${id}/issue`, payload).then((response) => response.data),
};

export const equipmentTransferApi = {
  list: (params) => client.get('/equipment-transfers', { params }).then((response) => response.data),
};

export const equipmentMissingApi = {
  list: (params) => client.get('/equipment-missing-reports', { params }).then((response) => response.data),
  resolve: (id, payload) => client.post(`/equipment-missing-reports/${id}/resolve`, payload).then((response) => response.data),
};
