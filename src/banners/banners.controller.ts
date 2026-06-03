import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BannersService } from './banners.service';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all home page promotion banners' })
  @ApiResponse({ status: 200, description: 'Returns all banners' })
  async getBanners() {
    return this.bannersService.getBanners();
  }
}
