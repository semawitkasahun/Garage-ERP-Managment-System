import apiClient from '@/services/http/axios';

export const qrAttendanceApi = {
  // Generate QR token (admin/manager only)
  async generateToken(branchId) {
    const { data } = await apiClient.post('/qr-attendance/generate-token', { branch_id: branchId });
    return data;
  },
  
  // Validate QR token
  async validateToken(token) {
    const { data } = await apiClient.post('/qr-attendance/validate-token', { token });
    return data;
  },
  
  // Check-in via QR
  async checkIn(token) {
    const { data } = await apiClient.post('/qr-attendance/check-in', { token });
    return data;
  },
  
  // Check-out via QR
  async checkOut(token) {
    const { data } = await apiClient.post('/qr-attendance/check-out', { token });
    return data;
  },
  
  // Get current attendance status
  async getCurrentStatus() {
    const { data } = await apiClient.get('/qr-attendance/current-status');
    return data;
  }
};