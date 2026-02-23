import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryUsersDto {
  @ApiPropertyOptional({ enum: ['SUPER_ADMIN', 'RWA_ADMIN', 'DEALER', 'OWNER', 'BUYER_TENANT'] })
  role?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] })
  status?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number;
}
