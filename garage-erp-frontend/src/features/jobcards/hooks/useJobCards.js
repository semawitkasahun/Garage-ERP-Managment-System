import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobCardsApi } from '../api/jobCardsApi';

// Query keys
export const jobCardKeys = {
  all: ['job-cards'],
  lists: () => [...jobCardKeys.all, 'list'],
  list: (filters) => [...jobCardKeys.lists(), filters],
  details: () => [...jobCardKeys.all, 'detail'],
  detail: (id) => [...jobCardKeys.details(), id],
  workOrder: (workOrderId) => [...jobCardKeys.all, 'work-order', workOrderId],
  technician: (technicianId) => [...jobCardKeys.all, 'technician', technicianId],
  progress: (id) => [...jobCardKeys.detail(id), 'progress'],
};

// Hooks
export const useJobCards = (params = {}) => {
  return useQuery({
    queryKey: jobCardKeys.list(params),
    queryFn: () => jobCardsApi.getAll(params).then(res => res.data),
  });
};

export const useJobCard = (id) => {
  return useQuery({
    queryKey: jobCardKeys.detail(id),
    queryFn: () => jobCardsApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
};

export const useJobCardsByWorkOrder = (workOrderId) => {
  return useQuery({
    queryKey: jobCardKeys.workOrder(workOrderId),
    queryFn: () => jobCardsApi.getByWorkOrder(workOrderId).then(res => res.data),
    enabled: !!workOrderId,
  });
};

export const useJobCardsByTechnician = (technicianId) => {
  return useQuery({
    queryKey: jobCardKeys.technician(technicianId),
    queryFn: () => jobCardsApi.getByTechnician(technicianId).then(res => res.data),
    enabled: !!technicianId,
  });
};

export const useJobCardProgress = (id) => {
  return useQuery({
    queryKey: jobCardKeys.progress(id),
    queryFn: () => jobCardsApi.getProgress(id).then(res => res.data),
    enabled: !!id,
  });
};

// Mutations
export const useCreateJobCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => jobCardsApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      if (data?.work_order_id || data?.job_card?.work_order_id) {
        queryClient.invalidateQueries({ queryKey: jobCardKeys.workOrder(data?.work_order_id || data?.job_card?.work_order_id) });
      }
    },
  });
};

export const useUpdateJobCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => jobCardsApi.update(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      const jcId = data?.job_card_id || data?.job_card?.job_card_id;
      const woId = data?.work_order_id || data?.job_card?.work_order_id;
      if (jcId) {
        queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(jcId) });
      }
      if (woId) {
        queryClient.invalidateQueries({ queryKey: jobCardKeys.workOrder(woId) });
      }
    },
  });
};

export const useDeleteJobCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => jobCardsApi.delete(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
};

export const useStartJobCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => jobCardsApi.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
};

export const usePauseJobCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => jobCardsApi.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
};

export const useResumeJobCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => jobCardsApi.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
};

export const useCompleteJobCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => jobCardsApi.complete(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
};

export const useInventoryItems = (params = {}) => {
  return useQuery({
    queryKey: ['inventory-items', params],
    queryFn: () => jobCardsApi.getInventoryItems(params),
  });
};

export const useAssignTechnician = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => jobCardsApi.assignTechnician(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
};

export const useAddPart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => jobCardsApi.addPart(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      const jcId = data?.job_card_id || data?.job_card?.job_card_id;
      if (jcId) {
        queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(jcId) });
      }
    },
  });
};

export const useAddLabor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => jobCardsApi.addLabor(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      const jcId = data?.job_card_id || data?.job_card?.job_card_id;
      if (jcId) {
        queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(jcId) });
      }
    },
  });
};

export const useSubmitQc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => jobCardsApi.submitQc(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobCardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      const jcId = data?.job_card_id || data?.job_card?.job_card_id;
      const woId = data?.work_order_id || data?.job_card?.work_order_id;
      if (jcId) {
        queryClient.invalidateQueries({ queryKey: jobCardKeys.detail(jcId) });
      }
      if (woId) {
        queryClient.invalidateQueries({ queryKey: jobCardKeys.workOrder(woId) });
      }
    },
  });
};