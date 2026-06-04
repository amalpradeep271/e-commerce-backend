import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get total users, orders, revenue, products count' })
  @ApiResponse({ status: 200, description: 'Stats data' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/recent-orders')
  @ApiOperation({ summary: 'Get last 10 orders' })
  @ApiResponse({ status: 200, description: 'Recent orders list' })
  async getRecentOrders() {
    return this.adminService.getRecentOrders();
  }

  @Get('dashboard/revenue-chart')
  @ApiOperation({ summary: 'Get revenue data for last 30 days' })
  @ApiResponse({ status: 200, description: 'Revenue list grouped by day' })
  async getRevenueChart() {
    return this.adminService.getRevenueChart();
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  @Get('products')
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200, description: 'Returns products list' })
  async getProducts(@Query('search') search?: string, @Query('categoryId') categoryId?: string) {
    return this.adminService.getProducts(search, categoryId);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Returns created product' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.adminService.createProduct(createProductDto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Returns updated status' })
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.adminService.updateProduct(id, updateProductDto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Post('products/:id/images')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a product image to Cloudinary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Returns uploaded image URL' })
  async uploadProductImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    return this.adminService.uploadProductImage(id, file.buffer);
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({ status: 200, description: 'Returns categories list' })
  async getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, description: 'Returns created category' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Returns updated category' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ==========================================
  // BANNERS
  // ==========================================

  @Get('banners')
  @ApiOperation({ summary: 'List all banners' })
  @ApiResponse({ status: 200, description: 'Returns banners list' })
  async getBanners() {
    return this.adminService.getBanners();
  }

  @Post('banners')
  @ApiOperation({ summary: 'Create a banner' })
  @ApiResponse({ status: 201, description: 'Returns created banner' })
  async createBanner(@Body() dto: CreateBannerDto) {
    return this.adminService.createBanner(dto);
  }

  @Put('banners/:id')
  @ApiOperation({ summary: 'Update a banner' })
  @ApiResponse({ status: 200, description: 'Returns updated banner' })
  async updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.adminService.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: 'Delete a banner' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteBanner(@Param('id') id: string) {
    return this.adminService.deleteBanner(id);
  }

  // ==========================================
  // ORDERS
  // ==========================================

  @Get('orders')
  @ApiOperation({ summary: 'List all orders (with status filter)' })
  @ApiResponse({ status: 200, description: 'Returns orders list' })
  async getOrders(@Query('status') status?: string) {
    return this.adminService.getOrders(status);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order detail' })
  @ApiResponse({ status: 200, description: 'Returns detailed order information' })
  async getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Returns created status history entry' })
  async updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(id, dto);
  }

  // ==========================================
  // USERS
  // ==========================================

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Returns users list' })
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'Returns updated user details' })
  async updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto);
  }

  // ==========================================
  // REVIEWS
  // ==========================================

  @Get('reviews')
  @ApiOperation({ summary: 'List all reviews' })
  @ApiResponse({ status: 200, description: 'Returns reviews list' })
  async getReviews() {
    return this.adminService.getReviews();
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  // ==========================================
  // COUPONS
  // ==========================================

  @Get('coupons')
  @ApiOperation({ summary: 'List all coupons' })
  @ApiResponse({ status: 200, description: 'Returns coupons list' })
  async getCoupons() {
    return this.adminService.getCoupons();
  }

  @Post('coupons')
  @ApiOperation({ summary: 'Create a coupon' })
  @ApiResponse({ status: 201, description: 'Returns created coupon' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.adminService.createCoupon(dto);
  }

  @Put('coupons/:id')
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiResponse({ status: 200, description: 'Returns updated coupon' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.adminService.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteCoupon(@Param('id') id: string) {
    return this.adminService.deleteCoupon(id);
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  @Post('notifications')
  @ApiOperation({ summary: 'Send push/broadcast notification' })
  @ApiResponse({ status: 201, description: 'Returns created notification' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.adminService.sendNotification(dto);
  }
}
