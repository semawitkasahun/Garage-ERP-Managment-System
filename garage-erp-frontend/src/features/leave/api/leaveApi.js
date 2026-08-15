import apiClient from '@/services/http/axios';

export const leaveApi = {
  async list({ employee_id, status, leave_type, from_date, to_date, page } = {}) {
    const { data } = await apiClient.get('/leave-requests', { 
      params: { employee_id, status, leave_type, from_date, to_date, page, per_page: 20 } 
    });
    return data;
  },
  
  async getStats({ branch_id } = {}) {
    const { data } = await apiClient.get('/leave-requests/stats', { params: { branch_id } });
    return data;
  },
  
  async getToday({ branch_id } = {}) {
    const { data } = await apiClient.get('/leave-requests/today', { params: { branch_id } });
    return data;
  },
  
  async getPending() {
    const { data } = await apiClient.get('/leave-requests/pending');
    return data;
  },
  
  async getApproved() {
    const { data } = await apiClient.get('/leave-requests/approved');
    return data;
  },
  
  async create(payload) {
    const { data } = await apiClient.post('/leave-requests', payload);
    return data;
  },
  
  async get(leaveId) {
    const { data } = await apiClient.get(`/leave-requests/${leaveId}`);
    return data;
  },
  
  async update(leaveId, payload) {
    const { data } = await apiClient.patch(`/leave-requests/${leaveId}`, payload);
    return data;
  },
  
  async remove(leaveId) {
    await apiClient.delete(`/leave-requests/${leaveId}`);
  },
  
  async approve(leaveId, approvedBy) {
    const { data } = await apiClient.post(`/leave-requests/${leaveId}/approve`, { approved_by: approvedBy });
    return data;
  },
  
  async reject(leaveId, rejectionReason) {
    const { data } = await apiClient.post(`/leave-requests/${leaveId}/reject`, { rejection_reason: rejectionReason });
    return data;
  },
  
  async getByEmployee(employeeId) {
    const { data } = await apiClient.get(`/leave-requests/employee/${employeeId}`);
    return data;
  }
};