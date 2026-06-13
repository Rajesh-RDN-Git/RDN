import { apiClient } from '../api-client';

export const communicationApi = {
  conversations: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/communication/conversations', { params }),

  createConversation: (data: { leadId: string; participantId: string; message?: string }) =>
    apiClient.post('/communication/conversations', data),

  getConversation: (conversationId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/communication/conversations/${conversationId}`, { params }),

  sendMessage: (
    conversationId: string,
    data: { receiverId: string; content: string; type?: 'TEXT' | 'IMAGE' | 'FILE' },
  ) => apiClient.post(`/communication/conversations/${conversationId}/messages`, data),

  initiateCall: (data: { leadId: string; toUserId: string }) =>
    apiClient.post('/communication/call', data),
};
