import apiClient from '@/services/http/axios';

export const shiftsApi = {
  async list({ branch_id, department_id, is_active } = {}) {
    const { data } = await apiClient.get('/shifts', { 
      params: { branch_id, department_id, is_active } 
    });
    return data;
  },
  
  async create(payload) {
    const { data } = await apiClient.post('/shifts', payload);
    return data;
  },
  
  async get(shiftId) {
    const { data } = await apiClient.get(`/shifts/${shiftId}`);
    return data;
  },
  
  async update(shiftId, payload) {
    const { data } = await apiClient.patch(`/shifts/${shiftId}`, payload);
    return data;
  },
  
  async remove(shiftId) {
    await apiClient.delete(`/shifts/${shiftId}`);
  },
  
  async assignEmployee(shiftId, employeeId, { effective_date, end_date, is_primary } = {}) {
    const { data } = await apiClient.post(`/shifts/${shiftId}/employees`, { 
      employee_id: employeeId,
      effective_date,
      end_date,
      is_primary 
    });
    return data;
  },
  
  async removeEmployee(shiftId, employeeId) {
    await apiClient.delete(`/shifts/${shiftId}/employees/${employeeId}`);
  },
  
  async getEmployees(shiftId) {
    const { data } = await apiClient.get(`/shifts/${shiftId}/employees`);
    return data;
  }
};