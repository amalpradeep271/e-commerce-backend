import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({ description: 'User role', enum: ['admin', 'user'], example: 'admin' })
  @IsEnum(['admin', 'user'])
  @IsNotEmpty()
  role: string;
}
