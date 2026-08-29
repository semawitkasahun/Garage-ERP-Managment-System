import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';

export function useFinanceDashboard() {
  return useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: financeApi.getDashboard,
    refetchInterval: 30000,
  });
}

export function useFinanceTransactions(filters = {}) {
  return useQuery({
    queryKey: ['finance-transactions', filters],
    queryFn: () => financeApi.getTransactions(filters),
  });
}

export function useCashBank(filters = {}) {
  return useQuery({
    queryKey: ['cash-bank', filters],
    queryFn: () => financeApi.getCashBank(filters),
  });
}

export function useRecordCashBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.recordCashBank,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-bank'] });
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
    },
  });
}

export function useReceivables(filters = {}) {
  return useQuery({
    queryKey: ['finance-receivables', filters],
    queryFn: () => financeApi.getReceivables(filters),
  });
}

export function usePayables(filters = {}) {
  return useQuery({
    queryKey: ['finance-payables', filters],
    queryFn: () => financeApi.getPayables(filters),
  });
}

export function useReports(filters = {}) {
  return useQuery({
    queryKey: ['finance-reports', filters],
    queryFn: () => financeApi.getReports(filters),
    enabled: !!filters.type,
  });
}

export function useExpenses(filters = {}) {
  return useQuery({
    queryKey: ['finance-expenses', filters],
    queryFn: () => financeApi.getExpenses(filters),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenses'] });
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
      qc.invalidateQueries({ queryKey: ['cash-bank'] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => financeApi.updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenses'] });
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
      qc.invalidateQueries({ queryKey: ['cash-bank'] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.deleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenses'] });
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
      qc.invalidateQueries({ queryKey: ['cash-bank'] });
    },
  });
}

export function useApproveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => financeApi.approveExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenses'] });
    },
  });
}

export function usePayExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.payExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenses'] });
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
      qc.invalidateQueries({ queryKey: ['cash-bank'] });
    },
  });
}
