import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { bannerTable } from '../db/schema';

@Injectable()
export class BannersService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getBanners() {
    const banners = await this.drizzleService.db
      .select()
      .from(bannerTable)
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
