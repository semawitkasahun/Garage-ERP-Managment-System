import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/features/leave/api/leaveApi';

export function useLeaveRequests(filters = {}) {
  return useQuery({ 
    queryKey: ['leave-requests', filters], 
    queryFn: () => leaveApi.list(filters) 
  });
}

export function useLeaveStats({ branch_id } = {}) {
  return useQuery({ 
    queryKey: ['leave-stats', branch_id], 
    queryFn: () => leaveApi.getStats({ branch_id }),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useTodayLeave({ branch_id } = {}) {
  return useQuery({ 
    queryKey: ['today-leave', branch_id], 
    queryFn: () => leaveApi.getToday({ branch_id }),
    refetchInterval: 60000,
  });
}

export function usePendingLeave() {
  return useQuery({ 
    queryKey: ['pending-leave'], 
    queryFn: () => leaveApi.getPending(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useApprovedLeave() {
  return useQuery({ 
    queryKey: ['approved-leave'], 
    queryFn: () => leaveApi.getApproved() 
  });
}

export function useEmployeeLeave(employeeId) {
  return useQuery({ 
    queryKey: ['employee-leave', employeeId], 
    queryFn: () => leaveApi.getByEmployee(employeeId),
    enabled: !!employeeId
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['leave-stats'] });
      qc.invalidateQueries({ queryKey: ['employee-leave'] });
    },
  });
}

export function useUpdateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, payload }) => leaveApi.update(leaveId, payload),
    onSuccess: (_, { leaveId }) => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['leave-request', leaveId] });
    },
  });
}

export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['leave-stats'] });
    },
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, approvedBy }) => leaveApi.approve(leaveId, approvedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['pending-leave'] });
      qc.invalidateQueries({ queryKey: ['leave-stats'] });
    },
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, rejectionReason }) => leaveApi.reject(leaveId, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['pending-leave'] });
      qc.invalidateQueries({ queryKey: ['leave-stats'] });
    },
  });
}