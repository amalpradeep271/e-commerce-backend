import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist items' })
  @ApiResponse({ status: 200, description: 'Returns list of wishlisted products' })
  async getWishlist(@CurrentUser() user: any) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post('toggle/:productId')
  @ApiOperation({ summary: 'Toggle product in current user wishlist' })
  @ApiResponse({ status: 200, description: 'Toggles wishlist status and returns new state' })
  async toggleWishlist(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.wishlistService.toggleWishlist(user.id, productId);
  }
}
