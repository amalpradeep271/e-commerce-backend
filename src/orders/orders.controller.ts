import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new checkout order' })
  @ApiResponse({ status: 201, description: 'Order registered successfully' })
  async createOrder(
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user checkout orders history' })
  @ApiResponse({ status: 200, description: 'Returns order checkout history' })
  async getOrders(@CurrentUser() user: any) {
    return this.ordersService.getOrders(user.id);
  }

  @Get(':id/track')
  @ApiOperation({ summary: 'Get tracking timeline for an order' })
  @ApiResponse({ status: 200, description: 'Returns tracking timeline' })
  async getOrderTracking(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.getOrderTracking(user.id, id);
  }
}
