import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDealerDto {
  @ApiProperty({ example: 'Asha Singh', description: 'Dealer full name' })
  name!: string;

  @ApiProperty({ example: '+919876543210', description: 'Dealer phone number' })
  phone!: string;

  @ApiPropertyOptional({ example: 'asha@example.com', description: 'Dealer email (optional)' })
  email?: string;

  @ApiProperty({ example: 'uuid', description: 'Society the dealer belongs to' })
  societyId!: string;

  @ApiPropertyOptional({ description: 'Bank account details for commission payouts' })
  bankAccountDetails?: Record<string, unknown>;
}
