import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from '@/features/attendance/api/shiftsApi';

export function useShifts(filters = {}) {
  return useQuery({ queryKey: ['shifts', filters], queryFn: () => shiftsApi.list(filters) });
}

export function useShiftDetail(shiftId) {
  return useQuery({ 
    queryKey: ['shift', shiftId], 
    queryFn: () => shiftsApi.get(shiftId),
    enabled: !!shiftId
  });
}

export function useShiftEmployees(shiftId) {
  return useQuery({ 
    queryKey: ['shift-employees', shiftId], 
    queryFn: () => shiftsApi.getEmployees(shiftId),
    enabled: !!shiftId
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, payload }) => shiftsApi.update(shiftId, payload),
    onSuccess: (_, { shiftId }) => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      qc.invalidateQueries({ queryKey: ['shift', shiftId] });
    },
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useAssignEmployeeToShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, employeeId, data }) => shiftsApi.assignEmployee(shiftId, employeeId, data),
    onSuccess: (_, { shiftId }) => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      qc.invalidateQueries({ queryKey: ['shift', shiftId] });
      qc.invalidateQueries({ queryKey: ['shift-employees', shiftId] });
    },
  });
}

export function useRemoveEmployeeFromShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, employeeId }) => shiftsApi.removeEmployee(shiftId, employeeId),
    onSuccess: (_, { shiftId }) => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      qc.invalidateQueries({ queryKey: ['shift', shiftId] });
      qc.invalidateQueries({ queryKey: ['shift-employees', shiftId] });
    },
  });
}