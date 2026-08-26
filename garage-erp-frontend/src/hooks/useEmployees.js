// Wrapper hook for employees functionality
// This re-exports from the employees feature for convenience
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/http/axios';

export { useEmployees };

// Alias for useEmployees to match the naming in CheckOutModal
export function useEmployeesList(filters = {}) {
  return useEmployees(filters);
}

// Simple technicians list for equipment checkout (no role restrictions)
// Returns active employees from the Employee table
export function useTechniciansList() {
  return useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data } = await apiClient.get('/technicians');
      // The API now returns an array of active employees directly
      return data;
    },
  });
}
