import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/features/inventory/api/suppliersApi';

export function useSuppliersList(filters = {}) {
  return useQuery({
    queryKey: ['suppliers-list', filters],
    queryFn: () => suppliersApi.list(filters),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}