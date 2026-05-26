import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum DevicePlatformDto {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
}

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'FCM token or Expo push token', maxLength: 512 })
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  token!: string;

  @ApiProperty({ enum: DevicePlatformDto })
  @IsEnum(DevicePlatformDto)
  platform!: DevicePlatformDto;

  @ApiProperty({ required: false, description: 'App version e.g. 1.0.0' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  appVersion?: string;
}
