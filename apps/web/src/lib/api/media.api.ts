import { apiClient } from '../api-client';

export const mediaApi = {
  getPresignedUrl: (params: { fileName: string; contentType: string; propertyId?: string }) =>
    apiClient.post<{
      uploadUrl: string;
      key: string;
      cdnUrl: string;
      expiresIn: number;
      mock?: boolean;
    }>('/media/presigned-url', params),

  addMedia: (data: { propertyId: string; url: string; type: string; order?: number }) =>
    apiClient.post('/media', data),

  deleteMedia: (id: string) => apiClient.delete(`/media/${id}`),

  upload: (uploadUrl: string, file: Blob, onProgress?: (pct: number) => void) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed: ${xhr.status}`));
      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(file);
    }),
};
