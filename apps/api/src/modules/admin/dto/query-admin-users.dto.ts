import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAdminUsersDto {
  @ApiPropertyOptional({ enum: ['SUPER_ADMIN', 'RWA_ADMIN', 'DEALER', 'OWNER', 'BUYER_TENANT'] })
  role?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] })
  status?: string;

  @ApiPropertyOptional({ description: 'Search by name or phone' })
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
