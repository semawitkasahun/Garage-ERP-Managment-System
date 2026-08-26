import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  inventoryItemApi,
  inventoryTransactionApi,
  supplierApi,
  storageLocationApi,
  jobCardPartRequestApi,
  inventoryDashboardApi,
} from '@/api/inventory';

export function useInventoryDashboard() {
  return useQuery({
    queryKey: ['inventory', 'dashboard'],
    queryFn: () => inventoryDashboardApi.summary(),
    refetchInterval: 60_000,
  });
}

// --- Items ---

export function useInventoryItems(filters = {}) {
  return useQuery({
    queryKey: ['inventory-items', 'list', filters],
    queryFn: () => inventoryItemApi.list(filters),
    keepPreviousData: true,
  });
}

export function useInventoryItem(id) {
  return useQuery({
    queryKey: ['inventory-items', 'detail', id],
    queryFn: () => inventoryItemApi.get(id),
    enabled: !!id,
  });
}

export function useItemStockHistory(id, params = {}) {
  return useQuery({
    queryKey: ['inventory-items', 'history', id, params],
    queryFn: () => inventoryItemApi.history(id, params),
    enabled: !!id,
  });
}

function useInvalidateItems() {
  const queryClient = useQueryClient();
  return (id) => {
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    queryClient.invalidateQueries({ queryKey: ['inventory', 'dashboard'] });
    if (id) queryClient.invalidateQueries({ queryKey: ['inventory-items', 'detail', id] });
  };
}

export function useCreateInventoryItem() {
  const invalidate = useInvalidateItems();
  return useMutation({ mutationFn: (payload) => inventoryItemApi.create(payload), onSuccess: () => invalidate() });
}

export function useUpdateInventoryItem() {
  const invalidate = useInvalidateItems();
  return useMutation({
    mutationFn: ({ id, payload }) => inventoryItemApi.update(id, payload),
    onSuccess: (_d, { id }) => invalidate(id),
  });
}

export function useDeleteInventoryItem() {
  const invalidate = useInvalidateItems();
  return useMutation({ mutationFn: (id) => inventoryItemApi.remove(id), onSuccess: () => invalidate() });
}

// --- Stock transactions (the only path allowed to change quantity) ---

export function useStockTransactions(filters = {}) {
  return useQuery({
    queryKey: ['inventory-transactions', filters],
    queryFn: () => inventoryTransactionApi.list(filters),
  });
}

function useStockMutation(fn) {
  const invalidate = useInvalidateItems();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      invalidate(data?.inventory_item_id);
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
    },
  });
}

export function useReceiveStock() {
  return useStockMutation((payload) => inventoryTransactionApi.receive(payload));
}
export function useIssueStock() {
  return useStockMutation((payload) => inventoryTransactionApi.issue(payload));
}
export function useReturnStock() {
  return useStockMutation((payload) => inventoryTransactionApi.returnStock(payload));
}
export function useTransferStock() {
  return useStockMutation((payload) => inventoryTransactionApi.transfer(payload));
}
export function useAdjustStock() {
  return useStockMutation((payload) => inventoryTransactionApi.adjust(payload));
}

// --- Suppliers ---

export function useSuppliers(filters = {}) {
  return useQuery({ queryKey: ['suppliers', filters], queryFn: () => supplierApi.list(filters) });
}

export function useSupplier(id) {
  return useQuery({ queryKey: ['suppliers', 'detail', id], queryFn: () => supplierApi.get(id), enabled: !!id });
}

function useInvalidateSuppliers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['suppliers'] });
}

export function useCreateSupplier() {
  const invalidate = useInvalidateSuppliers();
  return useMutation({ mutationFn: (payload) => supplierApi.create(payload), onSuccess: invalidate });
}
export function useUpdateSupplier() {
  const invalidate = useInvalidateSuppliers();
  return useMutation({ mutationFn: ({ id, payload }) => supplierApi.update(id, payload), onSuccess: invalidate });
}
export function useDeleteSupplier() {
  const invalidate = useInvalidateSuppliers();
  return useMutation({ mutationFn: (id) => supplierApi.remove(id), onSuccess: invalidate });
}

// --- Storage locations ---

export function useStorageLocations() {
  return useQuery({ queryKey: ['storage-locations'], queryFn: () => storageLocationApi.list() });
}

export function useCreateStorageLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => storageLocationApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storage-locations'] }),
  });
}

// --- Job Card part requests ---

export function useJobCardPartRequests(filters = {}) {
  return useQuery({ queryKey: ['job-card-part-requests', filters], queryFn: () => jobCardPartRequestApi.list(filters) });
}

function useInvalidateJobCardRequests() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['job-card-part-requests'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
  };
}

export function useCreateJobCardPartRequest() {
  const invalidate = useInvalidateJobCardRequests();
  return useMutation({ mutationFn: (payload) => jobCardPartRequestApi.create(payload), onSuccess: invalidate });
}
export function useApproveJobCardPartRequest() {
  const invalidate = useInvalidateJobCardRequests();
  return useMutation({ mutationFn: ({ id, payload }) => jobCardPartRequestApi.approve(id, payload), onSuccess: invalidate });
}
export function useRejectJobCardPartRequest() {
  const invalidate = useInvalidateJobCardRequests();
  return useMutation({ mutationFn: ({ id, payload }) => jobCardPartRequestApi.reject(id, payload), onSuccess: invalidate });
}
export function useIssueJobCardPartRequest() {
  const invalidate = useInvalidateJobCardRequests();
  return useMutation({ mutationFn: (id) => jobCardPartRequestApi.issue(id), onSuccess: invalidate });
}
export function useReturnJobCardParts() {
  const invalidate = useInvalidateJobCardRequests();
  return useMutation({ mutationFn: ({ id, payload }) => jobCardPartRequestApi.returnParts(id, payload), onSuccess: invalidate });
}
