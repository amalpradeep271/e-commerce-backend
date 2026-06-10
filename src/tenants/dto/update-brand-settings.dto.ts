import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBrandSettingsDto {
  @ApiProperty({ description: 'Tenant name', example: 'FabIndia', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Tenant tagline', example: 'Celebrate India', required: false })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiProperty({ description: 'Tenant logo URL', example: 'https://example.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ description: 'Primary theme color', example: '#4F378A', required: false })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({ description: 'Secondary theme color', example: '#6750A4', required: false })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiProperty({ description: 'Font family', example: 'beVietnamPro', required: false })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiProperty({ description: 'Currency code', example: 'INR', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Currency symbol', example: '₹', required: false })
  @IsString()
  @IsOptional()
  currencySymbol?: string;
}
