import { Injectable, Logger } from '@nestjs/common';

/**
 * Lightweight email facade. v1 logs to console; v2 wires AWS SES.
 * Wired now so callers do not need to refactor when SES env is configured.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: any = null;
  private readonly fromAddress = process.env.SES_FROM_ADDRESS || 'no-reply@rdn.example.com';

  constructor() {
    void this.initSes();
  }

  private async initSes() {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
      this.logger.warn('SES not configured (missing AWS_REGION / AWS_ACCESS_KEY_ID)');
      return;
    }
    try {
      const { SESClient } = (await import('@aws-sdk/client-ses' as any)) as any;
      this.sesClient = new SESClient({ region: process.env.AWS_REGION });
      this.logger.log('SES client initialised');
    } catch {
      this.logger.warn('@aws-sdk/client-ses not installed; emails will be logged only');
    }
  }

  async send(opts: {
    to: string | string[];
    subject: string;
    bodyText: string;
    bodyHtml?: string;
  }): Promise<boolean> {
    const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];

    if (!this.sesClient) {
      this.logger.log(
        `[email-stub] to=${recipients.join(',')} subject="${opts.subject}" body="${opts.bodyText.slice(0, 200)}"`,
      );
      return true;
    }

    try {
      const { SendEmailCommand } = (await import('@aws-sdk/client-ses' as any)) as any;
      await this.sesClient.send(
        new SendEmailCommand({
          Source: this.fromAddress,
          Destination: { ToAddresses: recipients },
          Message: {
            Subject: { Data: opts.subject },
            Body: {
              Text: { Data: opts.bodyText },
              ...(opts.bodyHtml ? { Html: { Data: opts.bodyHtml } } : {}),
            },
          },
        }),
      );
      return true;
    } catch (err: any) {
      this.logger.error(`SES send failed: ${err?.message}`);
      return false;
    }
  }
}
