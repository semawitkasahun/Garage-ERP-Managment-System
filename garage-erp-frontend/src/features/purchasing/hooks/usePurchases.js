import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchasingApi } from '../api/purchasingApi';

export const purchaseKeys = {
  all: ['purchases'],
  lists: () => [...purchaseKeys.all, 'list'],
  list: (filters) => [...purchaseKeys.lists(), filters],
  details: () => [...purchaseKeys.all, 'detail'],
  detail: (id) => [...purchaseKeys.details(), id],
  summary: () => [...purchaseKeys.all, 'summary'],
};

export function usePurchasesList(filters = {}) {
  return useQuery({
    queryKey: purchaseKeys.list(filters),
    queryFn: () => purchasingApi.getAll(filters),
  });
}

export function usePurchaseSummary() {
  return useQuery({
    queryKey: purchaseKeys.summary(),
    queryFn: () => purchasingApi.getSummary(),
  });
}

export function usePurchaseDetail(id) {
  return useQuery({
    queryKey: purchaseKeys.detail(id),
    queryFn: () => purchasingApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchasingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
    },
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => purchasingApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(variables.id) });
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchasingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchasingApi.markAsPaid,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amountPaid }) => purchasingApi.updatePayment(id, amountPaid),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useAddItemToInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, branchId }) => purchasingApi.addItemToInventory(itemId, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
    },
  });
}
