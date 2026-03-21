import { apiClient } from '../api-client';

export const mediaApi = {
  getPresignedUrl: (data: { fileName: string; contentType: string }) =>
    apiClient.post('/media/presigned-url', data),

  addMedia: (data: { propertyId: string; url: string; type: string; order?: number }) =>
    apiClient.post('/media', data),

  getByProperty: (propertyId: string) => apiClient.get(`/media/property/${propertyId}`),

  remove: (id: string) => apiClient.delete(`/media/${id}`),
};
