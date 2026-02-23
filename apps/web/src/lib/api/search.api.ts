import { apiClient } from '../api-client';

export const searchApi = {
  searchProperties: (params: Record<string, unknown>) =>
    apiClient.get('/search/properties', { params }),
};
