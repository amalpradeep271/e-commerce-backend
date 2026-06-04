import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ description: 'Label for the address (e.g. Home, Work, Other)', example: 'Home' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Full name of recipient', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Phone number of recipient', example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Address line 1 (street, building, etc.)', example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({ description: 'Address line 2 (optional)', example: 'Apt 4B', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ description: 'City', example: 'Kochi' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State', example: 'Kerala' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'PIN Code / ZIP Code', example: '682001' })
  @IsString()
  @IsNotEmpty()
  pinCode: string;

  @ApiProperty({ description: 'Set as default address', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
