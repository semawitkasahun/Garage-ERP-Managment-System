import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { equipmentApi } from '@/features/inventory/api/equipmentApi';

export function useEquipmentList(filters = {}) {
  return useQuery({ queryKey: ['equipment-list', filters], queryFn: () => equipmentApi.list(filters) });
}

export function useTechnicians() {
  return useQuery({ queryKey: ['technicians'], queryFn: equipmentApi.technicians });
}

export function useAccountability(filters = {}) {
  return useQuery({
    queryKey: ['equipment-accountability', filters],
    queryFn: () => equipmentApi.accountability(filters),
    refetchInterval: 30000,
  });
}

export function useEndOfShift() {
  return useQuery({ queryKey: ['equipment-end-of-shift'], queryFn: equipmentApi.endOfShift });
}

export function useMyEquipment() {
  return useQuery({ queryKey: ['my-equipment'], queryFn: equipmentApi.myCheckedOutEquipment });
}

function invalidateEquipment(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['equipment-accountability'] });
  queryClient.invalidateQueries({ queryKey: ['equipment-end-of-shift'] });
  queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
  queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['my-equipment'] });
}

export function useCheckoutEquipment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: equipmentApi.checkout, onSuccess: () => invalidateEquipment(queryClient) });
}

export function useReturnEquipment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: equipmentApi.returnEquipment, onSuccess: () => invalidateEquipment(queryClient) });
}

export function useTransferEquipment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: equipmentApi.transfer, onSuccess: () => invalidateEquipment(queryClient) });
}

export function useExtendReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutId, payload }) => equipmentApi.extendReturn(checkoutId, payload),
    onSuccess: () => invalidateEquipment(queryClient),
  });
}

export function useReportMissing() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: equipmentApi.reportMissing, onSuccess: () => invalidateEquipment(queryClient) });
}

export function useRequestEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: equipmentApi.requestEquipment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment-requests'] }),
  });
}