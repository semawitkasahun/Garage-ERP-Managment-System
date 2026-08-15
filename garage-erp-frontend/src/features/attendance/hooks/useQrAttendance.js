import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qrAttendanceApi } from '@/features/attendance/api/qrAttendanceApi';

export function useGenerateQrToken() {
  return useMutation({
    mutationFn: (branchId) => qrAttendanceApi.generateToken(branchId),
  });
}

export function useValidateQrToken() {
  return useMutation({
    mutationFn: (token) => qrAttendanceApi.validateToken(token),
  });
}

export function useQrCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token) => qrAttendanceApi.checkIn(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qr-attendance-status'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useQrCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token) => qrAttendanceApi.checkOut(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qr-attendance-status'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useQrAttendanceStatus() {
  return useQuery({ 
    queryKey: ['qr-attendance-status'], 
    queryFn: () => qrAttendanceApi.getCurrentStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}