import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/features/attendance/api/attendanceApi';

export function useAttendance(filters = {}) {
  return useQuery({ queryKey: ['attendance', filters], queryFn: () => attendanceApi.list(filters) });
}

export function useAttendanceStats(branchId) {
  return useQuery({ queryKey: ['attendance-stats', branchId], queryFn: () => attendanceApi.getStats(branchId) });
}

export function useAttendanceToday() {
  return useQuery({ queryKey: ['attendance-today'], queryFn: () => attendanceApi.getToday() });
}

export function useAttendanceByEmployee(employeeId) {
  return useQuery({ 
    queryKey: ['attendance-employee', employeeId], 
    queryFn: () => attendanceApi.getByEmployee(employeeId),
    enabled: !!employeeId
  });
}

export function useAttendanceDetail(attendanceId) {
  return useQuery({ 
    queryKey: ['attendance', attendanceId], 
    queryFn: () => attendanceApi.get(attendanceId),
    enabled: !!attendanceId
  });
}

export function useAttendanceSummary(filters = {}) {
  return useQuery({ 
    queryKey: ['attendance-summary', filters], 
    queryFn: () => attendanceApi.getSummary(filters),
    enabled: !!filters.from_date && !!filters.to_date
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.clockIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
      qc.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.clockOut,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
      qc.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attendanceId, payload }) => attendanceApi.update(attendanceId, payload),
    onSuccess: (_, { attendanceId }) => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance', attendanceId] });
      qc.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
}

export function useStartBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.startBreak,
    onSuccess: (_, attendanceId) => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance', attendanceId] });
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
    },
  });
}

export function useEndBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.endBreak,
    onSuccess: (_, attendanceId) => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance', attendanceId] });
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
    },
  });
}