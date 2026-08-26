import apiClient from '@/services/http/axios';

const API_BASE = '/job-cards';

export const jobCardsApi = {
  // Get all job cards
  getAll: (params) => apiClient.get(API_BASE, { params }).then(res => res.data),
  
  // Get job cards by work order
  getByWorkOrder: (workOrderId) => apiClient.get(`${API_BASE}/work-order/${workOrderId}`).then(res => res.data),
  
  // Get job cards by technician
  getByTechnician: (technicianId) => apiClient.get(`${API_BASE}/technician/${technicianId}`).then(res => res.data),
  
  // Get job cards by status
  getByStatus: (status) => apiClient.get(`${API_BASE}/status/${status}`).then(res => res.data),
  
  // Get job cards by priority
  getByPriority: (priority) => apiClient.get(`${API_BASE}/priority/${priority}`).then(res => res.data),
  
  // Get single job card
  getById: (id) => apiClient.get(`${API_BASE}/${id}`).then(res => res.data),
  
  // Get job card progress
  getProgress: (id) => apiClient.get(`${API_BASE}/${id}/progress`).then(res => res.data),
  
  // Create job card
  create: (data) => apiClient.post(API_BASE, data).then(res => res.data),
  
  // Update job card
  update: (id, data) => apiClient.patch(`${API_BASE}/${id}`, data).then(res => res.data),
  
  // Delete job card
  delete: (id) => apiClient.delete(`${API_BASE}/${id}`).then(res => res.data),
  
  // Start job card
  start: (id) => apiClient.post(`${API_BASE}/${id}/start`).then(res => res.data),
  
  // Pause job card
  pause: (id) => apiClient.post(`${API_BASE}/${id}/pause`).then(res => res.data),

  // Resume job card
  resume: (id) => apiClient.post(`${API_BASE}/${id}/resume`).then(res => res.data),

  // Complete job card
  complete: (id, data = {}) => apiClient.post(`${API_BASE}/${id}/complete`, data).then(res => res.data),
  
  // Assign technician
  assignTechnician: (id, data) => apiClient.post(`${API_BASE}/${id}/assign-technician`, data).then(res => res.data),
  
  // Add part to job card
  addPart: (id, data) => apiClient.post(`${API_BASE}/${id}/parts`, data).then(res => res.data),
  
  // Update part
  updatePart: (id, partId, data) => apiClient.patch(`${API_BASE}/${id}/parts/${partId}`, data).then(res => res.data),
  
  // Add labor to job card
  addLabor: (id, data) => apiClient.post(`${API_BASE}/${id}/labor`, data).then(res => res.data),
  
  // Submit QC
  submitQc: (id, data) => apiClient.post(`${API_BASE}/${id}/qc`, data).then(res => res.data),

  // Get inventory items
  getInventoryItems: (params) => apiClient.get('/inventory-items', { params }).then(res => res.data),
};