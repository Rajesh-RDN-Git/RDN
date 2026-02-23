import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { VerifySocietyDto } from './dto/verify-society.dto';
import type { VerifyPropertyDto } from './dto/verify-property.dto';
import type { VerifyDealerDto } from './dto/verify-dealer.dto';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async verifySociety(id: string, data: VerifySocietyDto): Promise<any> {
    const society = await this.prisma.society.findUnique({ where: { id } });
    if (!society) throw new NotFoundException('Society not found');

    const validTransitions: Record<string, string[]> = {
      PENDING: ['VERIFIED', 'FLAGGED', 'REJECTED'],
      FLAGGED: ['VERIFIED', 'REJECTED'],
    };

    const allowed = validTransitions[society.verificationStatus] || [];
    if (!allowed.includes(data.status)) {
      throw new BadRequestException(
        `Cannot transition from ${society.verificationStatus} to ${data.status}`,
      );
    }

    return this.prisma.society.update({
      where: { id },
      data: {
        verificationStatus: data.status as any,
        // Auto-activate society on verification
        ...(data.status === 'VERIFIED' ? { status: 'ONBOARDED' } : {}),
      },
    });
  }

  async verifyProperty(id: string, data: VerifyPropertyDto): Promise<any> {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');

    // Prisma uses enum names (PENDING, RWA_APPROVED, VERIFIED, FLAGGED, REJECTED)
    const validTransitions: Record<string, string[]> = {
      PENDING: ['RWA_APPROVED', 'FLAGGED', 'REJECTED'],
      RWA_APPROVED: ['VERIFIED', 'FLAGGED', 'REJECTED'],
      FLAGGED: ['VERIFIED', 'REJECTED'],
    };

    const currentStatus = property.verificationStatus;
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(data.status)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${data.status}`);
    }

    return this.prisma.property.update({
      where: { id },
      data: { verificationStatus: data.status as any },
    });
  }

  async verifyDealer(id: string, data: VerifyDealerDto): Promise<any> {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    // Prisma enum names: PENDING, APPROVED, REJECTED (mapped to KYC_PENDING etc. in DB)
    const validTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'REJECTED'],
      REJECTED: ['APPROVED'],
    };

    const allowed = validTransitions[dealer.kycStatus] || [];
    if (!allowed.includes(data.kycStatus)) {
      throw new BadRequestException(
        `Cannot transition KYC from ${dealer.kycStatus} to ${data.kycStatus}`,
      );
    }

    const updateData: any = { kycStatus: data.kycStatus };

    // Auto-activate dealer if all three checks pass
    if (
      data.kycStatus === 'APPROVED' &&
      dealer.rwaApprovalStatus === 'APPROVED' &&
      dealer.trainingStatus === 'COMPLETED'
    ) {
      updateData.isActive = true;
    }

    return this.prisma.dealer.update({
      where: { id },
      data: updateData,
    });
  }
}
