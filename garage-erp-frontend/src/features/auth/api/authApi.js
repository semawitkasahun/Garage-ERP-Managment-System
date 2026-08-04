import apiClient, { ensureCsrfCookie } from '@/services/http/axios';

export const authApi = {
  async login({ email, password }) {
    await ensureCsrfCookie();
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data; // { message, user, user_type, redirect }
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser() {
    const { data } = await apiClient.get('/auth/me');
    return data; // { user, user_type }
  },
};