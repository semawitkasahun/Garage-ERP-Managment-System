import apiClient from '@/services/http/axios';

const API_BASE = '/quotations';

export const quotationsApi = {
  // Get all quotations
  getAll: (params) => apiClient.get(API_BASE, { params }).then(res => res.data),
  
  // Get quotations by customer
  getByCustomer: (customerId) => apiClient.get(`${API_BASE}/customer/${customerId}`).then(res => res.data),
  
  // Get quotations by vehicle
  getByVehicle: (vehicleId) => apiClient.get(`${API_BASE}/vehicle/${vehicleId}`).then(res => res.data),
  
  // Get quotation by work order
  getByWorkOrder: (workOrderId) => apiClient.get(`${API_BASE}/work-order/${workOrderId}`).then(res => res.data),
  
  // Get quotation by checkin
  getByCheckin: (checkinId) => apiClient.get(`${API_BASE}/checkin/${checkinId}`).then(res => res.data),
  
  // Get single quotation
  getById: (id) => apiClient.get(`${API_BASE}/${id}`).then(res => res.data),
  
  // Create quotation
  create: (data) => apiClient.post(API_BASE, data).then(res => res.data),
  
  // Generate quotation from job cards
  generateFromJobCards: (data) => apiClient.post(`${API_BASE}/generate-from-job-cards`, data).then(res => res.data),
  
  // Update quotation
  update: (id, data) => apiClient.patch(`${API_BASE}/${id}`, data).then(res => res.data),
  
  // Delete quotation
  delete: (id) => apiClient.delete(`${API_BASE}/${id}`).then(res => res.data),
  
  // Send quotation to customer
  sendToCustomer: (id, data) => apiClient.post(`${API_BASE}/${id}/send`, data).then(res => res.data),
  
  // Customer approve quotation
  customerApprove: (id) => apiClient.post(`${API_BASE}/${id}/approve`).then(res => res.data),
  
  // Customer reject quotation
  customerReject: (id, data) => apiClient.post(`${API_BASE}/${id}/reject`, data).then(res => res.data),
};