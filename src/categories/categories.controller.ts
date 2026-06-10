import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CurrentTenantId } from '../common/decorators/current-tenant-id.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  async getCategories(@CurrentTenantId() tenantId: string) {
    return this.categoriesService.getCategories(tenantId);
  }
}
