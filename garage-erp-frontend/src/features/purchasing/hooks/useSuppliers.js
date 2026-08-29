import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/features/inventory/api/suppliersApi';

export const supplierKeys = {
  all: ['suppliers'],
  lists: () => [...supplierKeys.all, 'list'],
  list: (filters) => [...supplierKeys.lists(), filters],
  details: () => [...supplierKeys.all, 'detail'],
  detail: (id) => [...supplierKeys.details(), id],
  purchases: (id) => [...supplierKeys.detail(id), 'purchases'],
};

export function useSuppliersList(filters = {}) {
  return useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => suppliersApi.list(filters),
  });
}

export function useSupplierDetail(id) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => suppliersApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) });
    },
  });
}

export function useSupplierPurchases(id) {
  return useQuery({
    queryKey: supplierKeys.purchases(id),
    queryFn: () => suppliersApi.getSupplierPurchases(id),
    enabled: !!id,
  });
}
