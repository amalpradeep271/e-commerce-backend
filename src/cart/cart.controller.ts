import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({ summary: 'Add a product to cart' })
  @ApiResponse({ status: 201, description: 'Added to cart successfully' })
  async addToCart(@CurrentUser() user: any, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user cart products' })
  @ApiResponse({ status: 200, description: 'Returns all cart products' })
  async getCartProducts(@CurrentUser() user: any) {
    return this.cartService.getCartProducts(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a product from cart by cart item ID' })
  @ApiResponse({ status: 200, description: 'Product removed successfully' })
  async removeCartProduct(@CurrentUser() user: any, @Param('id') cartItemId: string) {
    return this.cartService.removeCartProduct(user.id, cartItemId);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if a product is in current user cart' })
  @ApiResponse({ status: 200, description: 'Returns boolean cart presence status' })
  async isProductInCart(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.cartService.isProductInCart(user.id, productId);
  }
}
