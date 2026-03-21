import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'] })
  paymentStatus!: string;
}
