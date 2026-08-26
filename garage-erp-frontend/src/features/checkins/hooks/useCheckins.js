import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkinsApi } from '@/features/checkins/api/checkinsApi';

export function useCheckinForm(appointmentId) {
  return useQuery({
    queryKey: ['checkinForm', appointmentId],
    queryFn: () => checkinsApi.getForm(appointmentId),
    enabled: !!appointmentId,
  });
}

export function useCreateCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => checkinsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useGetCheckin(checkinId) {
  return useQuery({
    queryKey: ['checkin', checkinId],
    queryFn: () => checkinsApi.get(checkinId),
    enabled: !!checkinId,
  });
}

export function useUpdateCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkinId, payload }) => checkinsApi.update(checkinId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useUploadCheckinMedia() {
  return useMutation({
    mutationFn: ({ checkinId, files }) => checkinsApi.uploadMedia(checkinId, files),
  });
}

export function useUploadCheckinSignature() {
  return useMutation({
    mutationFn: ({ checkinId, signature }) => checkinsApi.uploadSignature(checkinId, signature),
  });
}
