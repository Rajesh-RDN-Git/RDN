import { apiClient } from '../api-client';

export const referralsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/referrals', { params }),
  generateCode: () => apiClient.post('/referrals/generate'),
  validateCode: (code: string) => apiClient.get(`/referrals/validate/${code}`),
  applyCode: (code: string) => apiClient.post('/referrals/apply', { code }),
};
