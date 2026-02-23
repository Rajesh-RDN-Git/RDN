import { apiClient } from '../api-client';

export const communicationApi = {
  conversations: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/communication/conversations', { params }),

  messages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/communication/conversations/${conversationId}/messages`, { params }),

  sendMessage: (conversationId: string, data: { content: string }) =>
    apiClient.post(`/communication/conversations/${conversationId}/messages`, data),
};
