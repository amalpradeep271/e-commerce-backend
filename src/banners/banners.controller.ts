import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CurrentTenantId } from '../common/decorators/current-tenant-id.decorator';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all home page promotion banners' })
  @ApiResponse({ status: 200, description: 'Returns all banners' })
  async getBanners(@CurrentTenantId() tenantId: string) {
    return this.bannersService.getBanners(tenantId);
  }
}
