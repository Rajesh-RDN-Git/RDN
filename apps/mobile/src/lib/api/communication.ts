import { apiClient } from '../api-client';

export const communicationApi = {
  getConversations: (params?: Record<string, string>) =>
    apiClient.get('/communication/conversations', { params }),

  getConversation: (id: string, params?: Record<string, string>) =>
    apiClient.get(`/communication/conversations/${id}`, { params }),

  createConversation: (data: { leadId: string; participantId: string; message?: string }) =>
    apiClient.post('/communication/conversations', data),

  sendMessage: (
    conversationId: string,
    data: { receiverId: string; content: string; type?: string },
  ) => apiClient.post(`/communication/conversations/${conversationId}/messages`, data),

  call: (data: { leadId: string; toUserId: string }) => apiClient.post('/communication/call', data),
};
