import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  withXSRFToken: true, // axios auto-attaches the CSRF header from Laravel's XSRF-TOKEN cookie
  headers: { Accept: 'application/json' },
});

// Sanctum SPA auth needs this hit once before login/logout to set the CSRF cookie
export async function ensureCsrfCookie() {
  await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
}

export default apiClient;