import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateBrandSettingsDto } from './dto/update-brand-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get(':slug/config')
  @ApiOperation({ summary: 'Get branding configuration for a tenant by slug' })
  @ApiResponse({ status: 200, description: 'Returns tenant configuration' })
  async getTenantConfig(@Param('slug') slug: string) {
    return this.tenantsService.getTenantConfig(slug);
  }

  @Get('me/brand-settings')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Get brand settings for the logged-in tenant' })
  @ApiResponse({ status: 200, description: 'Returns tenant configuration' })
  async getBrandSettings(@CurrentUser() user: any) {
    return this.tenantsService.getTenantConfigById(user.tenantId);
  }

  @Patch('me/brand-settings')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Update brand settings for the logged-in tenant' })
  @ApiResponse({ status: 200, description: 'Returns updated tenant configuration' })
  async updateBrandSettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateBrandSettingsDto,
  ) {
    // CurrentUser has id and tenantId from JWT claims
    return this.tenantsService.updateBrandSettings(user.id, user.tenantId, dto);
  }
}
