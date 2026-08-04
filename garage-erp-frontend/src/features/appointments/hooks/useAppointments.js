import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, baysApi, techniciansApi } from '@/features/appointments/api/appointmentsApi';

/** Single-day fetch */
export function useAppointments({ date, branchId, status }) {
  return useQuery({
    queryKey: ['appointments', date, branchId, status],
    queryFn: () => appointmentsApi.list({ date, branchId, status }),
    enabled: Boolean(date),
  });
}

/** Multi-day range fetch (week / month views) */
export function useAppointmentsRange({ startDate, endDate, branchId }) {
  return useQuery({
    queryKey: ['appointments-range', startDate, endDate, branchId],
    queryFn: () => appointmentsApi.listRange({ startDate, endDate, branchId }),
    enabled: Boolean(startDate && endDate),
  });
}

export function useBays(branchId) {
  return useQuery({
    queryKey: ['bays', branchId],
    queryFn: () => baysApi.list(branchId),
  });
}

export function useTechnicians(branchId) {
  return useQuery({
    queryKey: ['technicians', branchId],
    queryFn: () => techniciansApi.list(branchId),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-range'] });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, ...payload }) => appointmentsApi.update(appointmentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-range'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, status }) => appointmentsApi.updateStatus(appointmentId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-range'] });
    },
  });
}

/** Drag-and-drop reschedule */
export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, ...fields }) => appointmentsApi.reschedule(appointmentId, fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-range'] });
    },
  });
}
