import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { bannerTable } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class BannersService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getBanners(tenantId: string) {
    const banners = await this.drizzleService.db
      .select()
      .from(bannerTable)
      .where(eq(bannerTable.tenantId, tenantId))
      .execute();

    return banners.map((banner) => ({
      BannerId: banner.id,
      BannerImage: banner.image,
      Title: banner.title,
      Subtitle: banner.subtitle,
      DiscountAmount: banner.discountAmount,
    }));
  }
}
