import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/features/employees/api/employeesApi';

export function useEmployees(filters = {}) {
  return useQuery({ queryKey: ['employees', filters], queryFn: () => employeesApi.list(filters) });
}

export function useEmployeeStats(branchId) {
  return useQuery({ queryKey: ['employee-stats', branchId], queryFn: () => employeesApi.stats(branchId) });
}

export function useEmployeeDetail(employeeId) {
  return useQuery({ 
    queryKey: ['employee', employeeId], 
    queryFn: () => employeesApi.get(employeeId),
    enabled: !!employeeId
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-stats'] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, payload }) => employeesApi.update(employeeId, payload),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-stats'] });
      qc.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-stats'] });
    },
  });
}