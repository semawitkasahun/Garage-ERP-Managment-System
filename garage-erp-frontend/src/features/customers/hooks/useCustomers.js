import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/features/customers/api/customersApi';

export function useCustomers({ search, page } = {}) {
  return useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => customersApi.list({ search, page }),
  });
}

export function useCustomerStats(branchId) {
  return useQuery({
    queryKey: ['customer-stats', branchId],
    queryFn: () => customersApi.stats(branchId),
  });
}

export function useCustomer(customerId) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.get(customerId),
    enabled: !!customerId,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer-stats'] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, payload }) => customersApi.update(customerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer-stats'] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer-stats'] });
    },
  });
}
