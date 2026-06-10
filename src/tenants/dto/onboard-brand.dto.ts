import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnboardBrandDto {
  @ApiProperty({ description: 'Tenant slug (e.g. brandname)', example: 'fabindia' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Tenant name', example: 'FabIndia' })
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @ApiProperty({ description: 'Admin email for the new brand', example: 'admin@fabindia.com' })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({ description: 'Admin password for the new brand', example: 'password123', required: false })
  @IsString()
  @IsOptional()
  adminPassword?: string;
}
