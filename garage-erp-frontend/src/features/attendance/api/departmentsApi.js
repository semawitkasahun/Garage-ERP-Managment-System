import apiClient from '@/services/http/axios';

export const departmentsApi = {
  async list({ branch_id, is_active } = {}) {
    const { data } = await apiClient.get('/departments', { 
      params: { branch_id, is_active } 
    });
    return data;
  },
  
  async create(payload) {
    const { data } = await apiClient.post('/departments', payload);
    return data;
  },
  
  async get(departmentId) {
    const { data } = await apiClient.get(`/departments/${departmentId}`);
    return data;
  },
  
  async update(departmentId, payload) {
    const { data } = await apiClient.patch(`/departments/${departmentId}`, payload);
    return data;
  },
  
  async remove(departmentId) {
    await apiClient.delete(`/departments/${departmentId}`);
  },
  
  async getEmployees(departmentId) {
    const { data } = await apiClient.get(`/departments/${departmentId}/employees`);
    return data;
  },
  
  async getShifts(departmentId) {
    const { data } = await apiClient.get(`/departments/${departmentId}/shifts`);
    return data;
  }
};