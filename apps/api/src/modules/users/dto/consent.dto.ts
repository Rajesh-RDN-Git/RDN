import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ConsentPurposeDto {
  CORE_SERVICE = 'CORE_SERVICE',
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  THIRD_PARTY = 'THIRD_PARTY',
}

export class GrantConsentDto {
  @ApiProperty({ enum: ConsentPurposeDto })
  @IsEnum(ConsentPurposeDto)
  purpose!: ConsentPurposeDto;

  @ApiProperty()
  @IsBoolean()
  granted!: boolean;

  @ApiProperty({ description: 'Privacy policy version, e.g. "1.0"' })
  @IsString()
  @MaxLength(16)
  policyVersion!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;
}
