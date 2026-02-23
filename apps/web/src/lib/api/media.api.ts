import { apiClient } from '../api-client';

export const mediaApi = {
  getPresignedUrl: (params: { fileName: string; contentType: string; folder: string }) =>
    apiClient.post<{ url: string; key: string }>('/media/presigned-url', params),

  addMedia: (data: { entityType: string; entityId: string; key: string; type: string }) =>
    apiClient.post('/media', data),

  deleteMedia: (id: string) => apiClient.delete(`/media/${id}`),
};
