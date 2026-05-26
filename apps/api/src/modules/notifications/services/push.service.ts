import { forwardRef, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { DeviceTokenService } from './device-token.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: any = null;

  constructor(
    @Optional()
    @Inject(forwardRef(() => DeviceTokenService))
    private readonly deviceTokens?: DeviceTokenService,
  ) {
    this.initFirebase();
  }

  private async initFirebase() {
    try {
      const admin = await import('firebase-admin');
      if (!admin.apps.length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
          });
          this.firebaseApp = admin;
          this.logger.log('Firebase Admin initialized');
        } else {
          this.logger.warn('FIREBASE_SERVICE_ACCOUNT not configured');
        }
      } else {
        this.firebaseApp = admin;
      }
    } catch {
      this.logger.warn('firebase-admin not available. Push notifications disabled.');
    }
  }

  async sendPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Push notification skipped.');
      return false;
    }

    try {
      await this.firebaseApp.messaging().send({
        token,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' as const },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      return true;
    } catch (err: any) {
      this.logger.error(`FCM push failed: ${err.message}`);
      return false;
    }
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    if (!this.firebaseApp || tokens.length === 0) return 0;

    try {
      const response = await this.firebaseApp.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data || {},
      });

      // Prune tokens that FCM reported as unregistered/invalid
      if (this.deviceTokens && response.responses) {
        const invalid: string[] = [];
        response.responses.forEach((r: any, idx: number) => {
          if (!r.success && r.error?.code) {
            const code = r.error.code as string;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              invalid.push(tokens[idx]);
            }
          }
        });
        if (invalid.length > 0) {
          await this.deviceTokens.pruneInvalid(invalid);
        }
      }

      return response.successCount;
    } catch (err: any) {
      this.logger.error(`FCM multicast failed: ${err.message}`);
      return 0;
    }
  }

  /**
   * Send a push notification to all registered devices for a user.
   * Silently no-ops if user has no devices or Firebase is not configured.
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    if (!this.deviceTokens) {
      this.logger.warn('DeviceTokenService not wired; cannot fan out to user');
      return 0;
    }
    const tokens = await this.deviceTokens.listForUser(userId);
    if (tokens.length === 0) return 0;
    return this.sendMulticast(tokens, title, body, data);
  }
}
