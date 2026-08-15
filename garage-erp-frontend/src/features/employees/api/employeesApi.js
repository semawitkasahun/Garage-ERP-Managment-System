import apiClient from '@/services/http/axios';

export const employeesApi = {
  async list({ search, page, branch_id, department, job_title, employment_status, hire_date_from, hire_date_to, sort_by, sort_direction } = {}) {
    const { data } = await apiClient.get('/employees', { 
      params: { 
        search, 
        page, 
        per_page: 20,
        branch_id,
        department,
        job_title,
        employment_status,
        hire_date_from,
        hire_date_to,
        sort_by,
        sort_direction
      } 
    });
    return data;
  },
  async stats(branchId) {
    const { data } = await apiClient.get('/employees/stats', { params: { branch_id: branchId } });
    return data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/employees', payload);
    return data;
  },
  async remove(employeeId) {
    await apiClient.delete(`/employees/${employeeId}`);
  },
  async get(employeeId) {
    const { data } = await apiClient.get(`/employees/${employeeId}`);
    return data;
  },
  async update(employeeId, payload) {
    const { data } = await apiClient.patch(`/employees/${employeeId}`, payload);
    return data;
  },
};