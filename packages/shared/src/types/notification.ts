export enum NotificationType {
  LEAD = 'LEAD',
  VISIT = 'VISIT',
  DEAL = 'DEAL',
  COMMISSION = 'COMMISSION',
  GRIEVANCE = 'GRIEVANCE',
  SYSTEM = 'SYSTEM',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  channel: NotificationChannel;
  readAt: Date | null;
  createdAt: Date;
}
