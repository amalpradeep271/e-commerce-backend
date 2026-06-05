import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { productTable, wishlistTable } from '../db/schema';
import { ProductsService } from '../products/products.service';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class WishlistService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly productsService: ProductsService,
  ) {}

  async getWishlist(userId: string) {
    // 1. Get all wishlist item mappings for this user
    const wishlistItems = await this.drizzleService.db
      .select({
        productId: wishlistTable.productId,
      })
      .from(wishlistTable)
      .where(eq(wishlistTable.userId, userId))
      .execute();

    if (wishlistItems.length === 0) {
      return [];
    }

    const dbProductIds = wishlistItems.map((item) => item.productId);

    // 2. Fetch the actual populated products from ProductsService
    return this.productsService.getProductsByInternalIds(dbProductIds);
  }

  async toggleWishlist(userId: string, productId: string) {
    // 1. Resolve client-side productId to database ID (UUID)
    const [product] = await this.drizzleService.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.productId, productId))
      .execute();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Check if product is already in user's wishlist
    const [existingWishlistItem] = await this.drizzleService.db
      .select({ id: wishlistTable.id })
      .from(wishlistTable)
      .where(
        and(
          eq(wishlistTable.userId, userId),
          eq(wishlistTable.productId, product.id),
        ),
      )
      .execute();

    if (existingWishlistItem) {
      // If it exists, remove it
      await this.drizzleService.db
        .delete(wishlistTable)
        .where(eq(wishlistTable.id, existingWishlistItem.id))
        .execute();
      return { message: 'Product removed from wishlist', isWishlisted: false };
    } else {
      // If it doesn't exist, add it
      await this.drizzleService.db
        .insert(wishlistTable)
        .values({
          userId,
          productId: product.id,
        })
        .execute();
      return { message: 'Product added to wishlist', isWishlisted: true };
    }
  }
}
