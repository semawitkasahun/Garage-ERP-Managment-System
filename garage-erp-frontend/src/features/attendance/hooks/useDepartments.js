import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@/features/attendance/api/departmentsApi';

export function useDepartments(filters = {}) {
  return useQuery({ queryKey: ['departments', filters], queryFn: () => departmentsApi.list(filters) });
}

export function useDepartmentDetail(departmentId) {
  return useQuery({ 
    queryKey: ['department', departmentId], 
    queryFn: () => departmentsApi.get(departmentId),
    enabled: !!departmentId
  });
}

export function useDepartmentEmployees(departmentId) {
  return useQuery({ 
    queryKey: ['department-employees', departmentId], 
    queryFn: () => departmentsApi.getEmployees(departmentId),
    enabled: !!departmentId
  });
}

export function useDepartmentShifts(departmentId) {
  return useQuery({ 
    queryKey: ['department-shifts', departmentId], 
    queryFn: () => departmentsApi.getShifts(departmentId),
    enabled: !!departmentId
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ departmentId, payload }) => departmentsApi.update(departmentId, payload),
    onSuccess: (_, { departmentId }) => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      qc.invalidateQueries({ queryKey: ['department', departmentId] });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}