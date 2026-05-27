import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

/**
 * Enforces retention periods documented in docs/compliance/RETENTION_POLICY.md.
 *
 * Times are in UTC. Disable via env RETENTION_CRON_DISABLED=true (useful in tests).
 */
@Injectable()
export class RetentionCron {
  private readonly logger = new Logger(RetentionCron.name);
  private readonly disabled = process.env.RETENTION_CRON_DISABLED === 'true';

  constructor(private readonly prisma: PrismaService) {}

  private skip(jobName: string): boolean {
    if (this.disabled) {
      this.logger.debug(`${jobName} skipped (RETENTION_CRON_DISABLED=true)`);
      return true;
    }
    return false;
  }

  // Notifications older than 90 days — daily at 02:30 UTC.
  @Cron('30 2 * * *')
  async purgeOldNotifications() {
    if (this.skip('purgeOldNotifications')) return;
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    this.logger.log(
      `purgeOldNotifications removed ${result.count} rows (< ${cutoff.toISOString()})`,
    );
  }

  // Audit logs older than 1 year — weekly Sundays 03:00 UTC.
  @Cron(CronExpression.EVERY_WEEK)
  async purgeOldAuditLogs() {
    if (this.skip('purgeOldAuditLogs')) return;
    const cutoff = new Date(Date.now() - 365 * 24 * 3600 * 1000);
    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    this.logger.log(`purgeOldAuditLogs removed ${result.count} rows (< ${cutoff.toISOString()})`);
  }

  // Device tokens not seen in 90 days — weekly Sundays 03:15 UTC.
  @Cron('15 3 * * 0')
  async purgeStaleDeviceTokens() {
    if (this.skip('purgeStaleDeviceTokens')) return;
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const result = await this.prisma.deviceToken.deleteMany({
      where: { lastSeenAt: { lt: cutoff } },
    });
    this.logger.log(`purgeStaleDeviceTokens removed ${result.count} rows`);
  }

  // OTPs that expired — every hour.
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredOtps() {
    if (this.skip('purgeExpiredOtps')) return;
    const now = new Date();
    const result = await this.prisma.user.updateMany({
      where: { otpExpiresAt: { lt: now }, otpHash: { not: null } },
      data: { otpHash: null, otpExpiresAt: null },
    });
    if (result.count > 0) {
      this.logger.log(`purgeExpiredOtps cleared ${result.count} expired OTPs`);
    }
  }

  // DPDP grievances older than 7 years — monthly on 1st at 04:00 UTC.
  @Cron('0 4 1 * *')
  async purgeOldDpdpGrievances() {
    if (this.skip('purgeOldDpdpGrievances')) return;
    const cutoff = new Date(Date.now() - 7 * 365 * 24 * 3600 * 1000);
    const result = await this.prisma.dpdpGrievance.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    this.logger.log(`purgeOldDpdpGrievances removed ${result.count} rows`);
  }
}
