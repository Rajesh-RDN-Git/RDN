import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: any = null;

  constructor() {
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
      return response.successCount;
    } catch (err: any) {
      this.logger.error(`FCM multicast failed: ${err.message}`);
      return 0;
    }
  }
}
