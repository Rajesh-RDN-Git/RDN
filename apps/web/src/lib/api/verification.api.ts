import { apiClient } from '../api-client';

export const verificationApi = {
  verifySociety: (id: string, data: Record<string, unknown>) =>
    apiClient.post(`/verification/societies/${id}`, data),
  verifyProperty: (id: string, data: Record<string, unknown>) =>
    apiClient.post(`/verification/properties/${id}`, data),
  verifyDealer: (id: string, data: Record<string, unknown>) =>
    apiClient.post(`/verification/dealers/${id}`, data),
};
