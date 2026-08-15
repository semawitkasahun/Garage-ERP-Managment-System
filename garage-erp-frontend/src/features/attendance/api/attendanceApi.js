import apiClient from '@/services/http/axios';

export const attendanceApi = {
  async list({ employee_id, status, from_date, to_date, page } = {}) {
    const { data } = await apiClient.get('/attendance', { 
      params: { 
        employee_id, 
        status, 
        from_date, 
        to_date, 
        page,
        per_page: 20 
      } 
    });
    return data;
  },
  
  async create(payload) {
    const { data } = await apiClient.post('/attendance', payload);
    return data;
  },
  
  async get(attendanceId) {
    const { data } = await apiClient.get(`/attendance/${attendanceId}`);
    return data;
  },
  
  async update(attendanceId, payload) {
    const { data } = await apiClient.patch(`/attendance/${attendanceId}`, payload);
    return data;
  },
  
  async remove(attendanceId) {
    await apiClient.delete(`/attendance/${attendanceId}`);
  },
  
  async clockIn(employeeId) {
    const { data } = await apiClient.post('/attendance/clock-in', { employee_id: employeeId });
    return data;
  },
  
  async clockOut(employeeId) {
    const { data } = await apiClient.post('/attendance/clock-out', { employee_id: employeeId });
    return data;
  },
  
  async startBreak(attendanceId) {
    const { data } = await apiClient.patch(`/attendance/${attendanceId}`, { break_start: new Date().toISOString() });
    return data;
  },
  
  async endBreak(attendanceId) {
    const { data } = await apiClient.patch(`/attendance/${attendanceId}`, { break_end: new Date().toISOString() });
    return data;
  },
  
  async getByEmployee(employeeId) {
    const { data } = await apiClient.get(`/attendance/employee/${employeeId}`);
    return data;
  },
  
  async getToday() {
    const { data } = await apiClient.get('/attendance/today');
    return data;
  },
  
  async getSummary({ from_date, to_date, employee_id } = {}) {
    const { data } = await apiClient.get('/attendance/summary', { 
      params: { from_date, to_date, employee_id } 
    });
    return data;
  },
  
  async getStats(branchId) {
    const { data } = await apiClient.get('/attendance/stats', { params: { branch_id: branchId } });
    return data;
  },
  
  async manualCorrection(payload) {
    const { data } = await apiClient.post('/attendance/manual-correction', payload);
    return data;
  },
  
  async getCorrections(attendanceId) {
    const { data } = await apiClient.get(`/attendance/${attendanceId}/corrections`);
    return data;
  }
};