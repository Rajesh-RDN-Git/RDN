import { apiClient } from '../api-client';

export const searchApi = {
  search: (params?: Record<string, string>) => apiClient.get('/search/properties', { params }),
};
