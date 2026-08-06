import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/features/leads/api/leadsApi';

export function useLeads(filters = {}) {
  return useQuery({ queryKey: ['leads', filters], queryFn: () => leadsApi.list(filters) });
}

export function useLeadStats() {
  return useQuery({ queryKey: ['lead-stats'], queryFn: leadsApi.stats });
}

export function useLead(leadId) {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadsApi.get(leadId),
    enabled: Boolean(leadId),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead-stats'] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, payload }) => leadsApi.update(leadId, payload),
    onSuccess: (_, { leadId }) => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useMarkLost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId) => leadsApi.markLost(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead-stats'] });
    },
  });
}

export function useAddFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, payload }) => leadsApi.addFollowup(leadId, payload),
    onSuccess: (_, { leadId }) => qc.invalidateQueries({ queryKey: ['lead', leadId] }),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, payload }) => leadsApi.convert(leadId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead-stats'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}