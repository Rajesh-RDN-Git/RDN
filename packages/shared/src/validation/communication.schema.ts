import { z } from 'zod';

export const createConversationSchema = z.object({
  leadId: z.string().uuid(),
  participantId: z.string().uuid(),
  message: z.string().min(1).max(2000).optional(),
});

export const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).optional(),
});

export const initiateCallSchema = z.object({
  leadId: z.string().uuid(),
  toUserId: z.string().uuid(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type InitiateCallInput = z.infer<typeof initiateCallSchema>;
