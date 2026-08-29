import apiClient from '@/services/http/axios';

const API_BASE = '/purchases';

export const purchasingApi = {
  // Get list of purchases
  getAll: (params) => apiClient.get(API_BASE, { params }).then((res) => res.data),

  // Get summary stats
  getSummary: () => apiClient.get(`${API_BASE}/summary`).then((res) => res.data),

  // Get single purchase
  getById: (id) => apiClient.get(`${API_BASE}/${id}`).then((res) => res.data),

  // Create new purchase
  create: (data) => apiClient.post(API_BASE, data).then((res) => res.data),

  // Update purchase details
  update: (id, data) => apiClient.put(`${API_BASE}/${id}`, data).then((res) => res.data),

  // Delete purchase
  delete: (id) => apiClient.delete(`${API_BASE}/${id}`).then((res) => res.data),

  // Mark purchase as paid
  markAsPaid: (id) => apiClient.put(`${API_BASE}/${id}/mark-paid`).then((res) => res.data),

  // Update partial payment
  updatePayment: (id, amountPaid) => apiClient.put(`${API_BASE}/${id}/payment`, { amount_paid: amountPaid }).then((res) => res.data),

  // Add purchased item to inventory stock
  addItemToInventory: (itemId, branchId) => apiClient.post(`/purchases/purchase-items/${itemId}/add-to-inventory`, { branch_id: branchId }).then((res) => res.data),
};
