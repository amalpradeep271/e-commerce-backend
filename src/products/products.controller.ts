import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { GetProductsQueryDto } from './dto/get-products-query.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get products with optional filtering' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query for product title' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sorting criteria: top-selling or new-in' })
  @ApiResponse({ status: 200, description: 'Returns products matching criteria' })
  async getProducts(@Query() query: GetProductsQueryDto) {
    return this.productsService.getProducts(query);
  }

  @Get('favorites')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user favorites' })
  @ApiResponse({ status: 200, description: 'Returns list of user favorited products' })
  async getFavorites(@CurrentUser() user: any) {
    return this.productsService.getFavorites(user.id);
  }

  @Get(':productId/is-favorite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if a product is favorited by current user' })
  @ApiResponse({ status: 200, description: 'Returns boolean favorite status' })
  async isFavorite(@CurrentUser() user: any, @Param('productId') productId: string) {
    const isFav = await this.productsService.isFavorite(user.id, productId);
    return isFav;
  }

  @Post(':productId/toggle-favorite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add or remove a product from current user favorites' })
  @ApiResponse({ status: 200, description: 'Toggles favorite and returns new status (true=favorited, false=unfavorited)' })
  async toggleFavorite(@CurrentUser() user: any, @Param('productId') productId: string) {
    const result = await this.productsService.toggleFavorite(user.id, productId);
    return result;
  }
}
