import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySocietiesDto {
  @ApiPropertyOptional({ example: 'Gurugram' })
  city?: string;

  @ApiPropertyOptional({ example: 'Haryana' })
  state?: string;

  @ApiPropertyOptional({ example: '122018' })
  pincode?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number;
}
