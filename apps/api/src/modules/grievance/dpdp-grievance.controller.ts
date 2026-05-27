import { Body, Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { scrubPii } from '../../common/utils/pii-scrub';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../notifications/services/email.service';

export enum DpdpCategoryDto {
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_ERASURE = 'DATA_ERASURE',
  DATA_CORRECTION = 'DATA_CORRECTION',
  CONSENT_WITHDRAWAL = 'CONSENT_WITHDRAWAL',
  DPDP_OTHER = 'DPDP_OTHER',
}

class SubmitDpdpGrievanceDto {
  @IsEnum(DpdpCategoryDto)
  category!: DpdpCategoryDto;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contact?: string;
}

@ApiTags('Grievance')
@Controller('grievance')
export class DpdpGrievanceController {
  private readonly logger = new Logger(DpdpGrievanceController.name);

  private readonly officerEmail =
    process.env.GRIEVANCE_OFFICER_EMAIL || 'grievance@rdn.example.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /**
   * Public endpoint — unauthenticated submission allowed since DPDP
   * grievance rights extend to non-account-holders.
   * SLA: acknowledge within 7 days, resolve within 30 days (DPDP Section 8(9)).
   */
  @Post('dpdp')
  @HttpCode(201)
  @Throttle({ default: { ttl: 3600_000, limit: 5 } })
  @ApiOperation({
    summary: 'Submit a DPDP data grievance (public, no auth required)',
  })
  async submit(@Body() body: SubmitDpdpGrievanceDto, @Req() req: Request) {
    const fwd = req.headers['x-forwarded-for'];
    const ip = typeof fwd === 'string' ? fwd.split(',')[0].trim() : req.ip;

    const record = await this.prisma.dpdpGrievance.create({
      data: {
        category: body.category,
        description: body.description,
        contact: body.contact ?? null,
        ip: ip ?? null,
        userAgent: (req.headers['user-agent'] as string) ?? null,
      },
    });

    this.logger.warn(
      `DPDP grievance received: ${JSON.stringify(
        scrubPii({ id: record.id, category: body.category }),
      )}`,
    );

    // Notify Grievance Officer (stubbed log until SES env is configured)
    void this.email.send({
      to: this.officerEmail,
      subject: `[DPDP] New grievance: ${body.category}`,
      bodyText: [
        `Ticket ID: ${record.id}`,
        `Category: ${body.category}`,
        `Submitted: ${record.createdAt.toISOString()}`,
        `Contact: ${body.contact ?? '(none)'}`,
        `IP: ${ip ?? '(unknown)'}`,
        '',
        'Description:',
        body.description,
        '',
        'SLA: acknowledge within 7 days, resolve within 30 days (DPDP §8(9)).',
      ].join('\n'),
    });

    return { ok: true, ticketId: record.id, acknowledgedAt: new Date().toISOString() };
  }
}
