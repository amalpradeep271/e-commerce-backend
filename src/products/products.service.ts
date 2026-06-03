import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { favoriteTable, productTable, productColorTable, productSizeTable, productImageTable, categoryTable } from '../db/schema';
import { eq, and, gte, like, ilike, inArray, sql } from 'drizzle-orm';

@Injectable()
export class ProductsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  private async populateProductsRelations(products: any[]) {
    if (products.length === 0) return [];

    const productIds = products.map((p) => p.id);

    // Fetch related colors, sizes, and images sequentially to reuse connection and avoid limits/timeouts
    const colors = await this.drizzleService.db
      .select()
      .from(productColorTable)
      .where(inArray(productColorTable.productId, productIds))
      .execute();

    const sizes = await this.drizzleService.db
      .select()
      .from(productSizeTable)
      .where(inArray(productSizeTable.productId, productIds))
      .execute();

    const images = await this.drizzleService.db
      .select()
      .from(productImageTable)
      .where(inArray(productImageTable.productId, productIds))
      .execute();

    return products.map((product) => {
      const productColors = colors
        .filter((c) => c.productId === product.id)
        .map((c) => {
          const hex = c.hexCode.replace(/^#/, '');
          let rgb = [0, 0, 0];
          if (hex.length === 6) {
            const numVal = parseInt(hex, 16);
            rgb = [
              (numVal >> 16) & 255,
              (numVal >> 8) & 255,
              numVal & 255
            ];
          } else if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            rgb = [r, g, b];
          }
          return { title: c.title, rgb };
        });

      const productSizes = sizes
        .filter((s) => s.productId === product.id)
        .map((s) => s.size);

      const productImages = images
        .filter((i) => i.productId === product.id)
        .map((i) => i.url);

      return {
        productId: product.productId,
        categoryId: product.categoryId ?? '',
        title: product.title,
        description: product.description,
        dimensions: product.dimensions,
        'manufacture information': product.manufactureInformation, // maps 1:1 to Flutter's 'manufacture information'
        price: Number(product.price),
        discountPrice: Number(product.discountPrice),
        gender: product.gender,
        salesNumber: product.salesNumber,
        createdDate: product.createdDate.toISOString(),
        colors: productColors,
        sizes: productSizes,
        images: productImages,
      };
    });
  }

  async getProducts(params: { categoryId?: string; search?: string; sort?: string; page?: number; limit?: number }) {
    const { categoryId, search, sort, page, limit } = params;

    let query = this.drizzleService.db.select().from(productTable);
    const conditions: any[] = [];

    // Filter by Category
    if (categoryId) {
      conditions.push(eq(productTable.categoryId, categoryId));
    }

    // Filter by Search (Title case-insensitive)
    if (search) {
      conditions.push(ilike(productTable.title, `%${search}%`));
    }

    // Filter by Sort Types
    if (sort === 'top-selling') {
      conditions.push(gte(productTable.salesNumber, 22));
    } else if (sort === 'new-in') {
      // Products created after July 25, 2024 (as defined in Flutter client)
      conditions.push(gte(productTable.createdDate, new Date('2024-07-25T00:00:00.000Z')));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (page && limit) {
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset) as any;
    } else if (limit) {
      query = query.limit(limit) as any;
    }

    const dbProducts = await query.execute();

    return this.populateProductsRelations(dbProducts);
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    // Resolve UUID for internal product ID
    const [product] = await this.drizzleService.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.productId, productId))
      .execute();

    if (!product) return false;

    const [fav] = await this.drizzleService.db
      .select({ id: favoriteTable.id })
      .from(favoriteTable)
      .where(and(eq(favoriteTable.userId, userId), eq(favoriteTable.productId, product.id)))
      .execute();

    return !!fav;
  }

  async toggleFavorite(userId: string, productId: string): Promise<boolean> {
    const [product] = await this.drizzleService.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.productId, productId))
      .execute();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [existingFav] = await this.drizzleService.db
      .select({ id: favoriteTable.id })
      .from(favoriteTable)
      .where(and(eq(favoriteTable.userId, userId), eq(favoriteTable.productId, product.id)))
      .execute();

    if (existingFav) {
      // Remove favorite
      await this.drizzleService.db
        .delete(favoriteTable)
        .where(eq(favoriteTable.id, existingFav.id))
        .execute();
      return false; // Return false indicating it is no longer favorite
    } else {
      // Add favorite
      await this.drizzleService.db
        .insert(favoriteTable)
        .values({
          userId,
          productId: product.id,
        })
        .execute();
      return true; // Return true indicating it is now favorited
    }
  }

  async getFavorites(userId: string) {
    // Get all products linked to user favorites
    const favProducts = await this.drizzleService.db
      .select({
        product: productTable,
      })
      .from(favoriteTable)
      .innerJoin(productTable, eq(favoriteTable.productId, productTable.id))
      .where(eq(favoriteTable.userId, userId))
      .execute();

    const dbProducts = favProducts.map((item) => item.product);
    return this.populateProductsRelations(dbProducts);
  }

  async getProductsByInternalIds(ids: string[]) {
    if (ids.length === 0) return [];
    const dbProducts = await this.drizzleService.db
      .select()
      .from(productTable)
      .where(inArray(productTable.id, ids))
      .execute();
    return this.populateProductsRelations(dbProducts);
  }
}

