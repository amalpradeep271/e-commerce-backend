import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import {
  userTable,
  orderTable,
  productTable,
  categoryTable,
  bannerTable,
  couponTable,
  reviewTable,
  orderItemTable,
  orderStatusTable,
  productColorTable,
  productSizeTable,
  productImageTable,
  notificationTable,
} from '../db/schema';
import { eq, gte, ilike, and, desc, sql, inArray } from 'drizzle-orm';
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
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  async getDashboardStats() {
    const [usersCountResult] = await this.drizzleService.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userTable)
      .execute();

    const [ordersCountResult] = await this.drizzleService.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orderTable)
      .execute();

    const [productsCountResult] = await this.drizzleService.db
      .select({ count: sql<number>`count(*)::int` })
      .from(productTable)
      .execute();

    const [revenueResult] = await this.drizzleService.db
      .select({ total: sql<string>`sum(total_price)` })
      .from(orderTable)
      .execute();

    return {
      totalUsers: usersCountResult?.count || 0,
      totalOrders: ordersCountResult?.count || 0,
      totalProducts: productsCountResult?.count || 0,
      totalRevenue: Number(revenueResult?.total || 0),
    };
  }

  async getRecentOrders() {
    const recentOrders = await this.drizzleService.db
      .select({
        id: orderTable.id,
        code: orderTable.code,
        itemCount: orderTable.itemCount,
        totalPrice: orderTable.totalPrice,
        createdDate: orderTable.createdDate,
        user: {
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
      })
      .from(orderTable)
      .innerJoin(userTable, eq(orderTable.userId, userTable.id))
      .orderBy(desc(orderTable.createdDate))
      .limit(10)
      .execute();

    return recentOrders.map((order) => ({
      ...order,
      totalPrice: Number(order.totalPrice),
    }));
  }

  async getRevenueChart() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await this.drizzleService.db
      .select({
        totalPrice: orderTable.totalPrice,
        createdDate: orderTable.createdDate,
      })
      .from(orderTable)
      .where(gte(orderTable.createdDate, thirtyDaysAgo))
      .execute();

    const revenueMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      revenueMap.set(dateString, 0);
    }

    for (const order of orders) {
      const dateString = order.createdDate.toISOString().split('T')[0];
      if (revenueMap.has(dateString)) {
        revenueMap.set(
          dateString,
          revenueMap.get(dateString)! + Number(order.totalPrice),
        );
      }
    }

    return Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }))
      .reverse();
  }

  // ==========================================
  // PRODUCTS CRUD
  // ==========================================

  async getProducts(search?: string, categoryId?: string, page?: number, limit?: number) {
    let query = this.drizzleService.db.select().from(productTable);
    const conditions: any[] = [];

    if (search) {
      conditions.push(ilike(productTable.title, `%${search}%`));
    }
    if (categoryId) {
      conditions.push(eq(productTable.categoryId, categoryId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Get total count matching conditions
    let countQuery = this.drizzleService.db
      .select({ count: sql<number>`count(*)::int` })
      .from(productTable);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const [countResult] = await countQuery.execute();
    const total = countResult?.count || 0;

    // Apply orderBy first
    let paginatedQuery = query.orderBy(desc(productTable.createdAt)) as any;

    // Apply pagination if provided
    if (page && limit) {
      const offset = (page - 1) * limit;
      paginatedQuery = paginatedQuery.limit(limit).offset(offset) as any;
    }

    const products = await paginatedQuery.execute();
    if (products.length === 0) {
      return { products: [], total: 0 };
    }

    const productIds = products.map((p) => p.id);

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

    const mappedProducts = products.map((product) => {
      const pColors = colors.filter((c) => c.productId === product.id);
      const pSizes = sizes.filter((s) => s.productId === product.id);
      const pImages = images.filter((i) => i.productId === product.id);

      return {
        ...product,
        price: Number(product.price),
        discountPrice: Number(product.discountPrice),
        colors: pColors.map((c) => ({ title: c.title, hexCode: c.hexCode })),
        sizes: pSizes.map((s) => s.size),
        images: pImages.map((i) => i.url),
      };
    });

    return { products: mappedProducts, total };
  }

  async createProduct(dto: CreateProductDto) {
    // Check if category exists
    const [category] = await this.drizzleService.db
      .select({ id: categoryTable.id })
      .from(categoryTable)
      .where(eq(categoryTable.id, dto.categoryId))
      .execute();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if productId is unique
    const [existingProduct] = await this.drizzleService.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.productId, dto.productId))
      .execute();

    if (existingProduct) {
      throw new BadRequestException(
        `Product with ID '${dto.productId}' already exists`,
      );
    }

    return this.drizzleService.db.transaction(async (tx) => {
      const [product] = await tx
        .insert(productTable)
        .values({
          productId: dto.productId,
          categoryId: dto.categoryId,
          title: dto.title,
          description: dto.description,
          dimensions: dto.dimensions,
          manufactureInformation: dto.manufactureInformation,
          price: dto.price.toString(),
          discountPrice: dto.discountPrice.toString(),
          gender: dto.gender,
        })
        .returning()
        .execute();

      // Insert Colors
      if (dto.colors && dto.colors.length > 0) {
        for (const col of dto.colors) {
          await tx
            .insert(productColorTable)
            .values({
              productId: product.id,
              title: col.title,
              hexCode: col.hexCode,
            })
            .execute();
        }
      }

      // Insert Sizes
      if (dto.sizes && dto.sizes.length > 0) {
        for (const sz of dto.sizes) {
          await tx
            .insert(productSizeTable)
            .values({
              productId: product.id,
              size: sz,
            })
            .execute();
        }
      }

      // Insert Images
      if (dto.images && dto.images.length > 0) {
        for (const imgUrl of dto.images) {
          await tx
            .insert(productImageTable)
            .values({
              productId: product.id,
              url: imgUrl,
            })
            .execute();
        }
      }

      return product;
    });
  }

  async getProduct(id: string) {
    const [product] = await this.drizzleService.db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .execute();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const colors = await this.drizzleService.db
      .select()
      .from(productColorTable)
      .where(eq(productColorTable.productId, id))
      .execute();

    const sizes = await this.drizzleService.db
      .select()
      .from(productSizeTable)
      .where(eq(productSizeTable.productId, id))
      .execute();

    const images = await this.drizzleService.db
      .select()
      .from(productImageTable)
      .where(eq(productImageTable.productId, id))
      .execute();

    return {
      ...product,
      price: Number(product.price),
      discountPrice: Number(product.discountPrice),
      colors: colors.map((c) => ({ title: c.title, hexCode: c.hexCode })),
      sizes: sizes.map((s) => s.size),
      images: images.map((i) => i.url),
    };
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const [product] = await this.drizzleService.db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .execute();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.drizzleService.db.transaction(async (tx) => {
      // Update basic fields
      await tx
        .update(productTable)
        .set({
          categoryId: dto.categoryId,
          productId: dto.productId,
          title: dto.title,
          description: dto.description,
          dimensions: dto.dimensions,
          manufactureInformation: dto.manufactureInformation,
          price: dto.price !== undefined ? dto.price.toString() : undefined,
          discountPrice:
            dto.discountPrice !== undefined
              ? dto.discountPrice.toString()
              : undefined,
          gender: dto.gender,
          updatedAt: new Date(),
        })
        .where(eq(productTable.id, id))
        .execute();

      // Update Colors if provided
      if (dto.colors) {
        await tx
          .delete(productColorTable)
          .where(eq(productColorTable.productId, id))
          .execute();
        for (const col of dto.colors) {
          await tx
            .insert(productColorTable)
            .values({
              productId: id,
              title: col.title,
              hexCode: col.hexCode,
            })
            .execute();
        }
      }

      // Update Sizes if provided
      if (dto.sizes) {
        await tx
          .delete(productSizeTable)
          .where(eq(productSizeTable.productId, id))
          .execute();
        for (const sz of dto.sizes) {
          await tx
            .insert(productSizeTable)
            .values({
              productId: id,
              size: sz,
            })
            .execute();
        }
      }

      // Update Images if provided
      if (dto.images) {
        await tx
          .delete(productImageTable)
          .where(eq(productImageTable.productId, id))
          .execute();
        for (const imgUrl of dto.images) {
          await tx
            .insert(productImageTable)
            .values({
              productId: id,
              url: imgUrl,
            })
            .execute();
        }
      }

      return { message: 'Product updated successfully' };
    });
  }

  async deleteProduct(id: string) {
    const [product] = await this.drizzleService.db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .execute();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.drizzleService.db
      .delete(productTable)
      .where(eq(productTable.id, id))
      .execute();
    return { message: 'Product deleted successfully' };
  }

  async uploadProductImage(id: string, fileBuffer: Buffer) {
    const [product] = await this.drizzleService.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.id, id))
      .execute();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const uploadResponse = await this.cloudinaryService.uploadFile(
      fileBuffer,
      'products',
    );

    const [newImg] = await this.drizzleService.db
      .insert(productImageTable)
      .values({
        productId: product.id,
        url: uploadResponse.secure_url,
      })
      .returning()
      .execute();

    return newImg;
  }

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  async getCategories() {
    return this.drizzleService.db
      .select()
      .from(categoryTable)
      .orderBy(desc(categoryTable.createdAt))
      .execute();
  }

  async createCategory(dto: CreateCategoryDto) {
    const [category] = await this.drizzleService.db
      .insert(categoryTable)
      .values({
        title: dto.title,
        image: dto.image,
      })
      .returning()
      .execute();

    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const [category] = await this.drizzleService.db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .execute();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const [updated] = await this.drizzleService.db
      .update(categoryTable)
      .set(dto)
      .where(eq(categoryTable.id, id))
      .returning()
      .execute();

    return updated;
  }

  async deleteCategory(id: string) {
    const [category] = await this.drizzleService.db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .execute();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.drizzleService.db
      .delete(categoryTable)
      .where(eq(categoryTable.id, id))
      .execute();
    return { message: 'Category deleted successfully' };
  }

  // ==========================================
  // BANNERS CRUD
  // ==========================================

  async getBanners() {
    return this.drizzleService.db
      .select()
      .from(bannerTable)
      .orderBy(desc(bannerTable.createdAt))
      .execute();
  }

  async createBanner(dto: CreateBannerDto) {
    const [banner] = await this.drizzleService.db
      .insert(bannerTable)
      .values({
        image: dto.image,
        discountAmount: dto.discountAmount,
      })
      .returning()
      .execute();

    return banner;
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    const [banner] = await this.drizzleService.db
      .select()
      .from(bannerTable)
      .where(eq(bannerTable.id, id))
      .execute();

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    const [updated] = await this.drizzleService.db
      .update(bannerTable)
      .set(dto)
      .where(eq(bannerTable.id, id))
      .returning()
      .execute();

    return updated;
  }

  async deleteBanner(id: string) {
    const [banner] = await this.drizzleService.db
      .select()
      .from(bannerTable)
      .where(eq(bannerTable.id, id))
      .execute();

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    await this.drizzleService.db
      .delete(bannerTable)
      .where(eq(bannerTable.id, id))
      .execute();
    return { message: 'Banner deleted successfully' };
  }

  // ==========================================
  // ORDERS CRUD
  // ==========================================

  async getOrders(status?: string) {
    const query = this.drizzleService.db
      .select({
        id: orderTable.id,
        code: orderTable.code,
        itemCount: orderTable.itemCount,
        totalPrice: orderTable.totalPrice,
        shippingAddress: orderTable.shippingAddress,
        createdDate: orderTable.createdDate,
        user: {
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
      })
      .from(orderTable)
      .innerJoin(userTable, eq(orderTable.userId, userTable.id));

    const orders = await query.orderBy(desc(orderTable.createdDate)).execute();
    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);

    const statuses = await this.drizzleService.db
      .select()
      .from(orderStatusTable)
      .where(inArray(orderStatusTable.orderId, orderIds))
      .execute();

    // Map and filter by status in JS
    const mapped = orders.map((order) => {
      const oStatuses = statuses.filter((s) => s.orderId === order.id);
      // Sort statuses by statusDate or ID to find latest status
      const latestStatus =
        oStatuses.length > 0
          ? oStatuses[oStatuses.length - 1].title
          : 'Pending';

      return {
        ...order,
        totalPrice: Number(order.totalPrice),
        status: latestStatus,
        statuses: oStatuses,
      };
    });

    if (status) {
      return mapped.filter(
        (o) => o.status.toLowerCase() === status.toLowerCase(),
      );
    }

    return mapped;
  }

  async getOrder(id: string) {
    const [order] = await this.drizzleService.db
      .select({
        id: orderTable.id,
        code: orderTable.code,
        itemCount: orderTable.itemCount,
        totalPrice: orderTable.totalPrice,
        shippingAddress: orderTable.shippingAddress,
        createdDate: orderTable.createdDate,
        user: {
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
      })
      .from(orderTable)
      .innerJoin(userTable, eq(orderTable.userId, userTable.id))
      .where(eq(orderTable.id, id))
      .execute();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = await this.drizzleService.db
      .select()
      .from(orderItemTable)
      .where(eq(orderItemTable.orderId, id))
      .execute();

    const statuses = await this.drizzleService.db
      .select()
      .from(orderStatusTable)
      .where(eq(orderStatusTable.orderId, id))
      .execute();

    return {
      ...order,
      totalPrice: Number(order.totalPrice),
      items: items.map((i) => ({ ...i, price: Number(i.price) })),
      statuses,
    };
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const [order] = await this.drizzleService.db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, id))
      .execute();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const [status] = await this.drizzleService.db
      .insert(orderStatusTable)
      .values({
        orderId: id,
        title: dto.status,
        isDone: dto.isDone ?? true,
        statusDate: new Date(),
      })
      .returning()
      .execute();

    // Trigger order update timestamp
    await this.drizzleService.db
      .update(orderTable)
      .set({ updatedAt: new Date() })
      .where(eq(orderTable.id, id))
      .execute();

    return status;
  }

  // ==========================================
  // USERS CRUD
  // ==========================================

  async getUsers() {
    const users = await this.drizzleService.db
      .select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
        image: userTable.image,
        role: userTable.role,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .orderBy(desc(userTable.createdAt))
      .execute();

    return users;
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto) {
    const [user] = await this.drizzleService.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id))
      .execute();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [updated] = await this.drizzleService.db
      .update(userTable)
      .set({ role: dto.role, updatedAt: new Date() })
      .where(eq(userTable.id, id))
      .returning({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
        role: userTable.role,
      })
      .execute();

    return updated;
  }

  // ==========================================
  // REVIEWS CRUD
  // ==========================================

  async getReviews() {
    const reviews = await this.drizzleService.db
      .select({
        id: reviewTable.id,
        title: reviewTable.title,
        content: reviewTable.content,
        rating: reviewTable.rating,
        createdAt: reviewTable.createdAt,
        user: {
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
        product: {
          id: productTable.id,
          title: productTable.title,
          productId: productTable.productId,
        },
      })
      .from(reviewTable)
      .innerJoin(userTable, eq(reviewTable.userId, userTable.id))
      .innerJoin(productTable, eq(reviewTable.productId, productTable.id))
      .orderBy(desc(reviewTable.createdAt))
      .execute();

    return reviews.map((r) => ({
      ...r,
      rating: Number(r.rating),
    }));
  }

  async deleteReview(id: string) {
    const [review] = await this.drizzleService.db
      .select()
      .from(reviewTable)
      .where(eq(reviewTable.id, id))
      .execute();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.drizzleService.db
      .delete(reviewTable)
      .where(eq(reviewTable.id, id))
      .execute();
    return { message: 'Review deleted successfully' };
  }

  // ==========================================
  // COUPONS CRUD
  // ==========================================

  async getCoupons() {
    const coupons = await this.drizzleService.db
      .select()
      .from(couponTable)
      .orderBy(desc(couponTable.createdAt))
      .execute();

    return coupons.map((c) => ({
      ...c,
      discountValue: Number(c.discountValue),
      minOrderAmount: Number(c.minOrderAmount),
    }));
  }

  async createCoupon(dto: CreateCouponDto) {
    const [existing] = await this.drizzleService.db
      .select()
      .from(couponTable)
      .where(eq(couponTable.code, dto.code))
      .execute();

    if (existing) {
      throw new BadRequestException(`Coupon code '${dto.code}' already exists`);
    }

    const [coupon] = await this.drizzleService.db
      .insert(couponTable)
      .values({
        code: dto.code,
        discountType: dto.discountType,
        discountValue: dto.discountValue.toString(),
        minOrderAmount:
          dto.minOrderAmount !== undefined
            ? dto.minOrderAmount.toString()
            : '0.00',
        maxUses: dto.maxUses,
        expiresAt: new Date(dto.expiresAt),
        isActive: dto.isActive ?? true,
      })
      .returning()
      .execute();

    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const [existing] = await this.drizzleService.db
      .select()
      .from(couponTable)
      .where(eq(couponTable.id, id))
      .execute();

    if (!existing) {
      throw new NotFoundException('Coupon not found');
    }

    const updateFields: any = { ...dto };
    if (dto.discountValue !== undefined)
      updateFields.discountValue = dto.discountValue.toString();
    if (dto.minOrderAmount !== undefined)
      updateFields.minOrderAmount = dto.minOrderAmount.toString();
    if (dto.expiresAt !== undefined)
      updateFields.expiresAt = new Date(dto.expiresAt);

    const [updated] = await this.drizzleService.db
      .update(couponTable)
      .set(updateFields)
      .where(eq(couponTable.id, id))
      .returning()
      .execute();

    return updated;
  }

  async deleteCoupon(id: string) {
    const [coupon] = await this.drizzleService.db
      .select()
      .from(couponTable)
      .where(eq(couponTable.id, id))
      .execute();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.drizzleService.db
      .delete(couponTable)
      .where(eq(couponTable.id, id))
      .execute();
    return { message: 'Coupon deleted successfully' };
  }

  async getNotifications() {
    return this.drizzleService.db
      .select({
        id: notificationTable.id,
        title: notificationTable.title,
        body: notificationTable.body,
        type: notificationTable.type,
        isRead: notificationTable.isRead,
        createdAt: notificationTable.createdAt,
        user: {
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
      })
      .from(notificationTable)
      .leftJoin(userTable, eq(notificationTable.userId, userTable.id))
      .orderBy(desc(notificationTable.createdAt))
      .execute();
  }

  async sendNotification(dto: SendNotificationDto) {
    if (dto.userId) {
      // Validate user exists
      const [user] = await this.drizzleService.db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.id, dto.userId))
        .execute();

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const [notification] = await this.drizzleService.db
      .insert(notificationTable)
      .values({
        userId: dto.userId || null,
        title: dto.title,
        body: dto.body,
        type: dto.type,
      })
      .returning()
      .execute();

    return notification;
  }

  async uploadGenericImage(fileBuffer: Buffer) {
    return this.cloudinaryService.uploadFile(fileBuffer, 'general');
  }
}
