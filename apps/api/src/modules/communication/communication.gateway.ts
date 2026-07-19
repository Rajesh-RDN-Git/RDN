import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { CommunicationService } from './communication.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'] },
})
export class CommunicationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(CommunicationGateway.name);
  private userSockets = new Map<string, string[]>();

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;

      // Track user's sockets
      const existing = this.userSockets.get(userId) || [];
      existing.push(client.id);
      this.userSockets.set(userId, existing);

      // Join user-specific room
      client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const filtered = sockets.filter((id) => id !== client.id);
      if (filtered.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, filtered);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const message = await this.communicationService.sendMessage(
        data.conversationId,
        {
          content: data.content,
        } as any,
        userId,
      );

      // Emit to sender and to the server-derived recipient (never a client-supplied
      // id) so a participant cannot inject messages into another user's socket.
      this.server.to(`user:${userId}`).emit('new_message', message);
      if (message.receiverId) {
        this.server.to(`user:${message.receiverId}`).emit('new_message', message);
      }

      return message;
    } catch (err) {
      this.logger.error(`send_message error: ${err}`);
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageIds: string[] },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Emit read receipt to other participants
    this.server.to(`user:${userId}`).emit('messages_read', {
      conversationId: data.conversationId,
      messageIds: data.messageIds,
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Resolve the recipient server-side (verifies membership) rather than trusting
    // a client-supplied receiverId.
    const receiverId = await this.communicationService.getOtherParticipant(
      data.conversationId,
      userId,
    );
    if (!receiverId) return;

    this.server.to(`user:${receiverId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId,
    });
  }

  // Helper to emit to a specific user from other services
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
