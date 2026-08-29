import apiClient from '@/services/http/axios';

export const financeApi = {
  getDashboard: () => apiClient.get('/finance/dashboard').then(res => res.data),
  
  getTransactions: (params) => apiClient.get('/finance/transactions', { params }).then(res => res.data),
  
  getCashBank: (params) => apiClient.get('/finance/cash-bank', { params }).then(res => res.data),
  
  recordCashBank: (data) => apiClient.post('/finance/cash-bank', data).then(res => res.data),
  
  getReceivables: (params) => apiClient.get('/finance/receivables', { params }).then(res => res.data),
  
  getPayables: (params) => apiClient.get('/finance/payables', { params }).then(res => res.data),
  
  getReports: (params) => apiClient.get('/finance/reports', { params }).then(res => res.data),
  
  // Expenses CRUD
  getExpenses: (params) => apiClient.get('/finance/expenses', { params }).then(res => res.data),
  
  createExpense: (data) => apiClient.post('/finance/expenses', data).then(res => res.data),
  
  updateExpense: (id, data) => apiClient.patch(`/finance/expenses/${id}`, data).then(res => res.data),
  
  deleteExpense: (id) => apiClient.delete(`/finance/expenses/${id}`).then(res => res.data),
  
  approveExpense: (id, data) => apiClient.post(`/finance/expenses/${id}/approve`, data).then(res => res.data),
  
  payExpense: (id) => apiClient.post(`/finance/expenses/${id}/pay`).then(res => res.data),
};
