export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  readAt: Date | null;
  createdAt: Date;
}

export interface IConversation {
  id: string;
  leadId: string | null;
  participants: string[];
  lastMessageAt: Date | null;
  createdAt: Date;
}
