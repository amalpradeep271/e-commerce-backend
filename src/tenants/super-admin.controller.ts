import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { OnboardBrandDto } from './dto/onboard-brand.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('onboard-brand')
  @ApiOperation({ summary: 'Onboard a new brand tenant and create its initial admin user' })
  @ApiResponse({ status: 201, description: 'Brand onboarded successfully' })
  async onboardBrand(@Body() dto: OnboardBrandDto) {
    return this.tenantsService.onboardBrand(dto);
  }
}
