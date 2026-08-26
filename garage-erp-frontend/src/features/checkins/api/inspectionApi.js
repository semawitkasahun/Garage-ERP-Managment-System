import apiClient from '@/services/http/axios';

export const inspectionApi = {
  async getCategories() {
    const { data } = await apiClient.get('/inspection-categories');
    return data;
  },

  async createInspection(checkinId, inspectorId) {
    const { data } = await apiClient.post(`/checkins/${checkinId}/inspection`, {
      inspector_id: inspectorId,
    });
    return data;
  },

  async updateInspection(inspectionId, payload) {
    const { data } = await apiClient.patch(`/checkin-inspections/${inspectionId}`, payload);
    return data;
  },

  async saveInspectionResults(inspectionId, results) {
    const { data } = await apiClient.post(`/checkin-inspections/${inspectionId}/results`, {
      results,
    });
    return data;
  },

  async uploadInspectionPhoto(resultId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(`/inspection-item-results/${resultId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteInspectionPhoto(photoId) {
    const { data } = await apiClient.delete(`/inspection-item-photos/${photoId}`);
    return data;
  },

  async createDamageRecord(checkinId, damageData) {
    const formData = new FormData();
    Object.keys(damageData).forEach(key => {
      if (damageData[key] !== null) {
        formData.append(key, damageData[key]);
      }
    });
    const { data } = await apiClient.post(`/checkins/${checkinId}/damage`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteDamageRecord(damageId) {
    const { data } = await apiClient.delete(`/vehicle-damage-records/${damageId}`);
    return data;
  },

  async recordCustomerSignature(checkinId, signatureDataUrl) {
    const { data } = await apiClient.post(`/checkins/${checkinId}/customer-signature`, {
      signature: signatureDataUrl,
    });
    return data;
  },

  async recordSignatureDecline(checkinId, reason) {
    const { data } = await apiClient.post(`/checkins/${checkinId}/signature-decline`, {
      reason,
    });
    return data;
  },

  async completeCheckin(checkinId) {
    const { data } = await apiClient.post(`/checkins/${checkinId}/complete`);
    return data;
  },

  async getInspectionSummary(checkinId) {
    const { data } = await apiClient.get(`/checkins/${checkinId}/inspection-summary`);
    return data;
  },

  async getInspectionReport(checkinId) {
    const { data } = await apiClient.get(`/checkins/${checkinId}/inspection-report`);
    return data;
  },

  async sendInspectionReportEmail(checkinId) {
    const { data } = await apiClient.post(`/checkins/${checkinId}/send-report-email`);
    return data;
  },

  async sendInspectionReportSMS(checkinId) {
    const { data } = await apiClient.post(`/checkins/${checkinId}/send-report-sms`);
    return data;
  },
};
