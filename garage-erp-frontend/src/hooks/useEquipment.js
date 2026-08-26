import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { equipmentApi, equipmentRequestApi, equipmentTransferApi, equipmentMissingApi } from '@/api/equipment';

const KEYS = {
  stats: () => ['equipment', 'stats'],
  list: (params) => ['equipment', 'list', params],
  detail: (id) => ['equipment', 'detail', id],
  history: (id) => ['equipment', 'history', id],
};

export function useEquipmentStats() {
  return useQuery({ queryKey: KEYS.stats(), queryFn: () => equipmentApi.stats() });
}

export function useEquipmentList(filters = {}) {
  return useQuery({ queryKey: KEYS.list(filters), queryFn: () => equipmentApi.list(filters) });
}

export function useEquipmentDetail(id) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => equipmentApi.get(id), enabled: !!id });
}

export function useEquipmentHistory(id) {
  return useQuery({ queryKey: KEYS.history(id), queryFn: () => equipmentApi.history(id), enabled: !!id });
}

function useInvalidateEquipment() {
  const queryClient = useQueryClient();
  return (id) => {
    queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['equipment', 'stats'] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: KEYS.history(id) });
    }
  };
}

export function useCreateEquipment() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: equipmentApi.create, onSuccess: () => invalidate() });
}

export function useUpdateEquipment() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentApi.update(id, payload), onSuccess: (_data, { id }) => invalidate(id) });
}

export function useDeleteEquipment() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: equipmentApi.remove, onSuccess: () => invalidate() });
}

export function useCheckOutEquipment() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentApi.checkOut(id, payload), onSuccess: (_data, { id }) => invalidate(id) });
}

export function useCheckInEquipment() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentApi.checkIn(id, payload), onSuccess: (_data, { id }) => invalidate(id) });
}

export function useAddMaintenanceLog() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentApi.addMaintenanceLog(id, payload), onSuccess: (_data, { id }) => invalidate(id) });
}

export function useCompleteMaintenance() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: equipmentApi.completeMaintenance, onSuccess: (_data, id) => invalidate(id) });
}

export function useRegenerateQr() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: equipmentApi.regenerateQr, onSuccess: (_data, id) => invalidate(id) });
}

export function useEquipmentAccountability(filters = {}) {
  return useQuery({ queryKey: ['equipment', 'accountability', filters], queryFn: () => equipmentApi.accountability(filters), refetchInterval: 60000 });
}

export function useCheckoutLog(filters = {}) {
  return useQuery({ queryKey: ['equipment', 'checkout-log', filters], queryFn: () => equipmentApi.checkoutLog(filters), refetchInterval: 60000 });
}

export function useLookupEquipmentByQr() {
  return useMutation({ mutationFn: equipmentApi.lookupByQr });
}

export function useExtendEquipment() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentApi.extend(id, payload), onSuccess: (_data, { id }) => invalidate(id) });
}

export function useReportMissing() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentApi.reportMissing(id, payload), onSuccess: (_data, { id }) => invalidate(id) });
}

export function useTransferEquipment() {
  const invalidate = useInvalidateEquipment();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentApi.transfer(id, payload), onSuccess: (_data, { id }) => invalidate(id) });
}

export function useEquipmentRequests(filters = {}) {
  return useQuery({ queryKey: ['equipment-requests', filters], queryFn: () => equipmentRequestApi.list(filters) });
}

function useInvalidateRequests() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });
}

export function useCreateEquipmentRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({ mutationFn: equipmentRequestApi.create, onSuccess: invalidate });
}

export function useApproveEquipmentRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentRequestApi.approve(id, payload), onSuccess: invalidate });
}

export function useRejectEquipmentRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({ mutationFn: ({ id, payload }) => equipmentRequestApi.reject(id, payload), onSuccess: invalidate });
}

export function useIssueEquipmentRequest() {
  const invalidate = useInvalidateRequests();
  const invalidateEquipment = useInvalidateEquipment();
  return useMutation({
    mutationFn: ({ id, payload }) => equipmentRequestApi.issue(id, payload),
    onSuccess: () => { invalidate(); invalidateEquipment(); },
  });
}

export function useEquipmentTransfers(filters = {}) {
  return useQuery({ queryKey: ['equipment-transfers', filters], queryFn: () => equipmentTransferApi.list(filters) });
}

export function useMissingReports(filters = {}) {
  return useQuery({ queryKey: ['equipment-missing-reports', filters], queryFn: () => equipmentMissingApi.list(filters) });
}

export function useResolveMissingReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => equipmentMissingApi.resolve(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-missing-reports'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'stats'] });
    },
  });
}

/**
 * Fetches a QR code image via the authenticated axios client (blob),
 * converts it to an object URL for use in <img> tags.
 * This bypasses the Sanctum auth cookie problem that blocks plain <img src="/api/..."> requests.
 */
export function useQrImage(equipmentId, type) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!equipmentId || !type) return;

    let revoked = false;
    setIsLoading(true);
    setError(null);

    equipmentApi
      .fetchQrBlob(equipmentId, type)
      .then((blob) => {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
      })
      .catch((err) => {
        if (!revoked) setError(err);
      })
      .finally(() => {
        if (!revoked) setIsLoading(false);
      });

    return () => {
      revoked = true;
      // Revoke old URL to free memory
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentId, type]);

  return { objectUrl, isLoading, error };
}
