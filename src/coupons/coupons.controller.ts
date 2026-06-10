import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate and apply a coupon code' })
  @ApiResponse({
    status: 200,
    description: 'Returns discount details if coupon is valid',
  })
  async validateCoupon(
    @CurrentUser() user: any,
    @Body() validateCouponDto: ValidateCouponDto,
  ) {
    return this.couponsService.validateCoupon(validateCouponDto, user.tenantId);
  }
}
