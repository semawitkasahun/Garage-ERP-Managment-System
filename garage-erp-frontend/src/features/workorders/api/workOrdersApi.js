import apiClient from '@/services/http/axios';

const API_BASE = '/work-orders';

export const workOrdersApi = {
  // Get all work orders
  getAll: (params) => apiClient.get(API_BASE, { params }),
  
  // Get work order summary
  getSummary: () => apiClient.get(`${API_BASE}/summary`),
  
  // Get pending work orders
  getPending: () => apiClient.get(`${API_BASE}/pending`),
  
  // Get in-progress work orders
  getInProgress: () => apiClient.get(`${API_BASE}/in-progress`),
  
  // Get completed work orders
  getCompleted: () => apiClient.get(`${API_BASE}/completed`),
  
  // Get work orders by customer
  getByCustomer: (customerId) => apiClient.get(`${API_BASE}/customer/${customerId}`),
  
  // Get work orders by vehicle
  getByVehicle: (vehicleId) => apiClient.get(`${API_BASE}/vehicle/${vehicleId}`),
  
  // Get work order by checkin
  getByCheckin: (checkinId) => apiClient.get(`${API_BASE}/checkin/${checkinId}`),
  
  // Get work orders by branch
  getByBranch: (branchId) => apiClient.get(`${API_BASE}/branch/${branchId}`),
  
  // Get single work order
  getById: (id) => apiClient.get(`${API_BASE}/${id}`),
  
  // Get work order activities
  getActivities: (id) => apiClient.get(`${API_BASE}/${id}/activities`),
  
  // Create work order
  create: (data) => apiClient.post(API_BASE, data),
  
  // Create work order (alternative endpoint)
  createWorkOrder: (workOrderData) => apiClient.post(`${API_BASE}/create`, workOrderData),
  
  // Update work order
  update: (id, data) => apiClient.patch(`${API_BASE}/${id}`, data),
  
  // Delete work order
  delete: (id) => apiClient.delete(`${API_BASE}/${id}`),
  
  // Start work order
  start: (id) => apiClient.post(`${API_BASE}/${id}/start`),
  
  // Complete work order
  complete: (id) => apiClient.post(`${API_BASE}/${id}/complete`),
  
  // Close work order
  close: (id) => apiClient.post(`${API_BASE}/${id}/close`),
};