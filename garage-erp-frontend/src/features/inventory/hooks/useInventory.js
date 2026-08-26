import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/inventory/api/inventoryApi';

export function useInventoryItems(filters = {}) {
  return useQuery({
    queryKey: ['inventory-items', filters],
    queryFn: () => inventoryApi.listItems(filters),
  });
}

export function useInventoryDashboard() {
  return useQuery({
    queryKey: ['inventory-dashboard'],
    queryFn: inventoryApi.dashboard,
    refetchInterval: 30000,
  });
}

export function useSuppliers() {
  return useQuery({ queryKey: ['suppliers'], queryFn: inventoryApi.suppliers });
}

export function useStorageLocations() {
  return useQuery({ queryKey: ['storage-locations'], queryFn: inventoryApi.storageLocations });
}

function invalidateInventory(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
  queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: inventoryApi.createItem, onSuccess: () => invalidateInventory(queryClient) });
}

export function useReceiveStock() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: inventoryApi.receiveStock, onSuccess: () => invalidateInventory(queryClient) });
}

export function useIssueStock() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: inventoryApi.issueStock, onSuccess: () => invalidateInventory(queryClient) });
}

export function useReturnStock() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: inventoryApi.returnStock, onSuccess: () => invalidateInventory(queryClient) });
}

export function useTransferStock() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: inventoryApi.transferStock, onSuccess: () => invalidateInventory(queryClient) });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: inventoryApi.adjustStock, onSuccess: () => invalidateInventory(queryClient) });
}

export function usePendingEquipmentRequests() {
  return useQuery({ queryKey: ['equipment-requests', 'pending'], queryFn: inventoryApi.pendingEquipmentRequests });
}

export function useApproveEquipmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }) => inventoryApi.approveEquipmentRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
    },
  });
}

export function useRejectEquipmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }) => inventoryApi.rejectEquipmentRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
    },
  });
}