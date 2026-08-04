import apiClient from '@/services/http/axios';

export const appointmentsApi = {
  /** Single-date fetch (day view) */
  async list({ date, branchId, status }) {
    const { data } = await apiClient.get('/appointments', {
      params: { date, branch_id: branchId, status },
    });
    return data;
  },

  /** Multi-day range fetch (week / month views) */
  async listRange({ startDate, endDate, branchId }) {
    const { data } = await apiClient.get('/appointments', {
      params: { start_date: startDate, end_date: endDate, branch_id: branchId },
    });
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/appointments', payload);
    return data;
  },

  async update(appointmentId, payload) {
    const { data } = await apiClient.patch(`/appointments/${appointmentId}`, payload);
    return data;
  },

  async updateStatus(appointmentId, status) {
    const { data } = await apiClient.patch(`/appointments/${appointmentId}`, { status });
    return data;
  },

  /** Drag-and-drop reschedule — updates time (and optionally bay/technician) */
  async reschedule(appointmentId, { scheduled_start, scheduled_end, bay_id, technician_id }) {
    const { data } = await apiClient.patch(`/appointments/${appointmentId}`, {
      scheduled_start,
      scheduled_end,
      ...(bay_id !== undefined && { bay_id }),
      ...(technician_id !== undefined && { technician_id }),
    });
    return data;
  },
};

export const baysApi = {
  async list(branchId) {
    const { data } = await apiClient.get('/bays', { params: { branch_id: branchId } });
    return data;
  },
};

export const techniciansApi = {
  async list(branchId) {
    const { data } = await apiClient.get('/technicians', { params: { branch_id: branchId } });
    return data;
  },
};
