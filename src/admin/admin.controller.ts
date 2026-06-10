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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
  async getStats(@CurrentUser() user: any) {
    return this.adminService.getDashboardStats(user.tenantId);
  }

  @Get('dashboard/recent-orders')
  @ApiOperation({ summary: 'Get last 10 orders' })
  @ApiResponse({ status: 200, description: 'Recent orders list' })
  async getRecentOrders(@CurrentUser() user: any) {
    return this.adminService.getRecentOrders(user.tenantId);
  }

  @Get('dashboard/revenue-chart')
  @ApiOperation({ summary: 'Get revenue data for last 30 days' })
  @ApiResponse({ status: 200, description: 'Revenue list grouped by day' })
  async getRevenueChart(@CurrentUser() user: any) {
    return this.adminService.getRevenueChart(user.tenantId);
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  @Get('products')
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200, description: 'Returns products list' })
  async getProducts(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : undefined;
    const limitNum = limit ? parseInt(limit) : undefined;
    return this.adminService.getProducts(user.tenantId, search, categoryId, pageNum, limitNum);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Returns created product' })
  async createProduct(@CurrentUser() user: any, @Body() createProductDto: CreateProductDto) {
    return this.adminService.createProduct(user.tenantId, createProductDto);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Returns detailed product' })
  async getProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.getProduct(user.tenantId, id);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Returns updated status' })
  async updateProduct(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(user.tenantId, id, updateProductDto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.deleteProduct(user.tenantId, id);
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
  async uploadProductImage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    return this.adminService.uploadProductImage(user.tenantId, id, file.buffer);
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({ status: 200, description: 'Returns categories list' })
  async getCategories(@CurrentUser() user: any) {
    return this.adminService.getCategories(user.tenantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, description: 'Returns created category' })
  async createCategory(@CurrentUser() user: any, @Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(user.tenantId, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Returns updated category' })
  async updateCategory(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(user.tenantId, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteCategory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.deleteCategory(user.tenantId, id);
  }

  // ==========================================
  // BANNERS
  // ==========================================

  @Get('banners')
  @ApiOperation({ summary: 'List all banners' })
  @ApiResponse({ status: 200, description: 'Returns banners list' })
  async getBanners(@CurrentUser() user: any) {
    return this.adminService.getBanners(user.tenantId);
  }

  @Post('banners')
  @ApiOperation({ summary: 'Create a banner' })
  @ApiResponse({ status: 201, description: 'Returns created banner' })
  async createBanner(@CurrentUser() user: any, @Body() dto: CreateBannerDto) {
    return this.adminService.createBanner(user.tenantId, dto);
  }

  @Put('banners/:id')
  @ApiOperation({ summary: 'Update a banner' })
  @ApiResponse({ status: 200, description: 'Returns updated banner' })
  async updateBanner(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.adminService.updateBanner(user.tenantId, id, dto);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: 'Delete a banner' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteBanner(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.deleteBanner(user.tenantId, id);
  }

  // ==========================================
  // ORDERS
  // ==========================================

  @Get('orders')
  @ApiOperation({ summary: 'List all orders (with status filter)' })
  @ApiResponse({ status: 200, description: 'Returns orders list' })
  async getOrders(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.adminService.getOrders(user.tenantId, status);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order detail' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed order information',
  })
  async getOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.getOrder(user.tenantId, id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({
    status: 200,
    description: 'Returns created status history entry',
  })
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(user.tenantId, id, dto);
  }

  // ==========================================
  // USERS
  // ==========================================

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Returns users list' })
  async getUsers(@CurrentUser() user: any) {
    return this.adminService.getUsers(user.tenantId);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'Returns updated user details' })
  async updateUserRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(user.tenantId, id, dto);
  }

  // ==========================================
  // REVIEWS
  // ==========================================

  @Get('reviews')
  @ApiOperation({ summary: 'List all reviews' })
  @ApiResponse({ status: 200, description: 'Returns reviews list' })
  async getReviews(@CurrentUser() user: any) {
    return this.adminService.getReviews(user.tenantId);
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteReview(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.deleteReview(user.tenantId, id);
  }

  // ==========================================
  // COUPONS
  // ==========================================

  @Get('coupons')
  @ApiOperation({ summary: 'List all coupons' })
  @ApiResponse({ status: 200, description: 'Returns coupons list' })
  async getCoupons(@CurrentUser() user: any) {
    return this.adminService.getCoupons(user.tenantId);
  }

  @Post('coupons')
  @ApiOperation({ summary: 'Create a coupon' })
  @ApiResponse({ status: 201, description: 'Returns created coupon' })
  async createCoupon(@CurrentUser() user: any, @Body() dto: CreateCouponDto) {
    return this.adminService.createCoupon(user.tenantId, dto);
  }

  @Put('coupons/:id')
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiResponse({ status: 200, description: 'Returns updated coupon' })
  async updateCoupon(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.adminService.updateCoupon(user.tenantId, id, dto);
  }

  @Delete('coupons/:id')
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiResponse({ status: 200, description: 'Returns delete status' })
  async deleteCoupon(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.deleteCoupon(user.tenantId, id);
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  @Get('notifications')
  @ApiOperation({ summary: 'Get all sent notifications' })
  @ApiResponse({ status: 200, description: 'Returns notifications list' })
  async getNotifications(@CurrentUser() user: any) {
    return this.adminService.getNotifications(user.tenantId);
  }

  @Post('notifications')
  @ApiOperation({ summary: 'Send push/broadcast notification' })
  @ApiResponse({ status: 201, description: 'Returns created notification' })
  async sendNotification(@CurrentUser() user: any, @Body() dto: SendNotificationDto) {
    return this.adminService.sendNotification(user.tenantId, dto);
  }

  @Post('uploads')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image to Cloudinary (generic)' })
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
  async uploadGenericImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    const uploadResult = await this.adminService.uploadGenericImage(
      file.buffer,
    );
    return { url: uploadResult.secure_url };
  }
}
