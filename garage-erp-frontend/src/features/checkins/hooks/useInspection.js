import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inspectionApi } from '@/features/checkins/api/inspectionApi';

export function useInspectionCategories() {
  return useQuery({
    queryKey: ['inspectionCategories'],
    queryFn: () => inspectionApi.getCategories(),
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkinId, inspectorId }) => inspectionApi.createInspection(checkinId, inspectorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inspectionId, payload }) => inspectionApi.updateInspection(inspectionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useSaveInspectionResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inspectionId, results }) => inspectionApi.saveInspectionResults(inspectionId, results),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useUploadInspectionPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resultId, file }) => inspectionApi.uploadInspectionPhoto(resultId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useDeleteInspectionPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId) => inspectionApi.deleteInspectionPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useCreateDamageRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkinId, damageData }) => inspectionApi.createDamageRecord(checkinId, damageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useDeleteDamageRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (damageId) => inspectionApi.deleteDamageRecord(damageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useRecordCustomerSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkinId, signature }) => inspectionApi.recordCustomerSignature(checkinId, signature),
    onSuccess: (_, { checkinId }) => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['checkin', checkinId] });
    },
  });
}

export function useRecordSignatureDecline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkinId, reason }) => inspectionApi.recordSignatureDecline(checkinId, reason),
    onSuccess: (_, { checkinId }) => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['checkin', checkinId] });
    },
  });
}

export function useCompleteCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkinId) => inspectionApi.completeCheckin(checkinId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useInspectionSummary(checkinId) {
  return useQuery({
    queryKey: ['inspectionSummary', checkinId],
    queryFn: () => inspectionApi.getInspectionSummary(checkinId),
    enabled: !!checkinId,
  });
}

export function useInspectionReport(checkinId) {
  return useQuery({
    queryKey: ['inspectionReport', checkinId],
    queryFn: () => inspectionApi.getInspectionReport(checkinId),
    enabled: !!checkinId,
  });
}

export function useSendInspectionReportEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkinId) => inspectionApi.sendInspectionReportEmail(checkinId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useSendInspectionReportSMS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkinId) => inspectionApi.sendInspectionReportSMS(checkinId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}
