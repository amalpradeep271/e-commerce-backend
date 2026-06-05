import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { couponTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async validateCoupon(validateCouponDto: ValidateCouponDto) {
    const { code, orderAmount } = validateCouponDto;

    const [coupon] = await this.drizzleService.db
      .select()
      .from(couponTable)
      .where(eq(couponTable.code, code))
      .execute();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is no longer active');
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      throw new BadRequestException('This coupon has expired');
    }

    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      throw new BadRequestException(
        'This coupon has reached its maximum usage limit',
      );
    }

    if (Number(orderAmount) < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount of $${coupon.minOrderAmount} is required to use this coupon`,
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount =
        (Number(orderAmount) * Number(coupon.discountValue)) / 100;
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    if (discountAmount > Number(orderAmount)) {
      discountAmount = Number(orderAmount);
    }

    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minOrderAmount: Number(coupon.minOrderAmount),
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  }
}
