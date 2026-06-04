import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category title', example: 'Hoodies' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Category image URL', example: 'https://example.com/category.jpg' })
  @IsString()
  @IsNotEmpty()
  image: string;
}
