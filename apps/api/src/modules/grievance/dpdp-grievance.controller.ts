import { Body, Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { scrubPii } from '../../common/utils/pii-scrub';
import { PrismaService } from '../../database/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public endpoint — unauthenticated submission allowed since DPDP
   * grievance rights extend to non-account-holders.
   * SLA: acknowledge within 7 days, resolve within 30 days (DPDP Section 8(9)).
   */
  @Post('dpdp')
  @HttpCode(201)
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

    // TODO(prod): email/Slack notify designated Grievance Officer
    return { ok: true, ticketId: record.id, acknowledgedAt: new Date().toISOString() };
  }
}
