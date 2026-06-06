import { apiClient } from '../api-client';

export const verificationApi = {
  propertyQueue: (params?: Record<string, string>) =>
    apiClient.get('/properties/verification-queue', { params }),
  decideProperty: (id: string, data: { decision: 'RWA_APPROVED' | 'REJECTED'; reason?: string }) =>
    apiClient.patch(`/properties/${id}/verification`, data),
  verifySociety: (id: string, data: { status: string; notes?: string }) =>
    apiClient.post(`/verification/society/${id}`, data),
  verifyDealer: (id: string, data: { kycStatus: 'APPROVED' | 'REJECTED'; notes?: string }) =>
    apiClient.post(`/verification/dealer/${id}`, data),
};
