import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersApi } from '../api/workOrdersApi';
import { useAuthStore } from '@/features/auth/store/authStore';

// Query keys
export const workOrderKeys = {
  all: ['work-orders'],
  lists: () => [...workOrderKeys.all, 'list'],
  list: (filters) => [...workOrderKeys.lists(), filters],
  details: () => [...workOrderKeys.all, 'detail'],
  detail: (id) => [...workOrderKeys.details(), id],
  summary: () => [...workOrderKeys.all, 'summary'],
  pending: () => [...workOrderKeys.all, 'pending'],
  inProgress: () => [...workOrderKeys.all, 'in-progress'],
  completed: () => [...workOrderKeys.all, 'completed'],
  activities: (id) => [...workOrderKeys.detail(id), 'activities'],
};

// Hooks
export const useWorkOrders = (params = {}) => {
  return useQuery({
    queryKey: workOrderKeys.list(params),
    queryFn: () => workOrdersApi.getAll(params),
    select: (response) => {
      // Axios wraps response in .data
      const rawData = response?.data !== undefined ? response.data : response;
      
      // Handle paginated response (Laravel pagination has a .data property inside the response JSON)
      if (rawData && rawData.data && Array.isArray(rawData.data)) {
        return rawData.data;
      }
      
      // Handle direct array response
      return Array.isArray(rawData) ? rawData : [];
    },
  });
};

export const useWorkOrder = (id) => {
  return useQuery({
    queryKey: workOrderKeys.detail(id),
    queryFn: () => workOrdersApi.getById(id),
    enabled: !!id,
    select: (response) => response?.data || response,
  });
};

export const useWorkOrderSummary = () => {
  return useQuery({
    queryKey: workOrderKeys.summary(),
    queryFn: () => workOrdersApi.getSummary(),
    select: (response) => response?.data || response,
  });
};

export const usePendingWorkOrders = () => {
  return useQuery({
    queryKey: workOrderKeys.pending(),
    queryFn: () => workOrdersApi.getPending(),
    select: (response) => response?.data || response,
  });
};

export const useInProgressWorkOrders = () => {
  return useQuery({
    queryKey: workOrderKeys.inProgress(),
    queryFn: () => workOrdersApi.getInProgress(),
    select: (response) => response?.data || response,
  });
};

export const useCompletedWorkOrders = () => {
  return useQuery({
    queryKey: workOrderKeys.completed(),
    queryFn: () => workOrdersApi.getCompleted(),
    select: (response) => response?.data || response,
  });
};

export const useWorkOrderActivities = (id) => {
  return useQuery({
    queryKey: workOrderKeys.activities(id),
    queryFn: () => workOrdersApi.getActivities(id),
    enabled: !!id,
    select: (response) => response?.data || response,
  });
};

// Mutations
export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data) => workOrdersApi.create(data),
    onSuccess: (response) => {
      const data = response?.data || response;
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.pending() });
      if (data.checkin_id) {
        queryClient.invalidateQueries({ queryKey: ['checkins', 'detail', data.checkin_id] });
      }
    },
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => workOrdersApi.update(id, data),
    onSuccess: (response) => {
      const data = response?.data || response;
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(data.work_order_id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => workOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
};

export const useStartWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => workOrdersApi.start(id),
    onSuccess: (response) => {
      const data = response?.data || response;
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(data.work_order_id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.inProgress() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.pending() });
    },
  });
};

export const useCompleteWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => workOrdersApi.complete(id),
    onSuccess: (response) => {
      const data = response?.data || response;
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(data.work_order_id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.completed() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.inProgress() });
    },
  });
};

export const useCloseWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => workOrdersApi.close(id),
    onSuccess: (response) => {
      const data = response?.data || response;
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(data.work_order_id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
};