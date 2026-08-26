import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '../api/quotationsApi';

// Query keys
export const quotationKeys = {
  all: ['quotations'],
  lists: () => [...quotationKeys.all, 'list'],
  list: (filters) => [...quotationKeys.lists(), filters],
  details: () => [...quotationKeys.all, 'detail'],
  detail: (id) => [...quotationKeys.details(), id],
  workOrder: (workOrderId) => [...quotationKeys.all, 'work-order', workOrderId],
  checkin: (checkinId) => [...quotationKeys.all, 'checkin', checkinId],
  customer: (customerId) => [...quotationKeys.all, 'customer', customerId],
};

// Hooks
export const useQuotations = (params = {}) => {
  return useQuery({
    queryKey: quotationKeys.list(params),
    queryFn: () => quotationsApi.getAll(params).then(res => res.data),
  });
};

export const useQuotation = (id) => {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: () => quotationsApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
};

export const useQuotationByWorkOrder = (workOrderId) => {
  return useQuery({
    queryKey: quotationKeys.workOrder(workOrderId),
    queryFn: () => quotationsApi.getByWorkOrder(workOrderId).then(res => res.data),
    enabled: !!workOrderId,
  });
};

export const useQuotationByCheckin = (checkinId) => {
  return useQuery({
    queryKey: quotationKeys.checkin(checkinId),
    queryFn: () => quotationsApi.getByCheckin(checkinId).then(res => res.data),
    enabled: !!checkinId,
  });
};

// Mutations
export const useCreateQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => quotationsApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      if (data.work_order_id) {
        queryClient.invalidateQueries({ queryKey: quotationKeys.workOrder(data.work_order_id) });
      }
    },
  });
};

export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => quotationsApi.update(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(data.quotation_id) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
};

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => quotationsApi.delete(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
};

export const useGenerateFromJobCards = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => quotationsApi.generateFromJobCards(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: quotationKeys.workOrder(data.work_order_id) });
    },
  });
};

export const useSendToCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => quotationsApi.sendToCustomer(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(data.quotation_id) });
    },
  });
};

export const useCustomerApprove = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => quotationsApi.customerApprove(id).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(data.quotation_id) });
      if (data.work_order_id) {
        queryClient.invalidateQueries({ queryKey: ['work-orders', 'detail', data.work_order_id] });
      }
    },
  });
};

export const useCustomerReject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => quotationsApi.customerReject(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(data.quotation_id) });
      if (data.work_order_id) {
        queryClient.invalidateQueries({ queryKey: ['work-orders', 'detail', data.work_order_id] });
      }
    },
  });
};