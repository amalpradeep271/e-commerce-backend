import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { cartItemTable, productTable, productImageTable } from '../db/schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { eq, and, inArray } from 'drizzle-orm';

@Injectable()
export class CartService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, productColor, productSize, prodctQuantity } =
      addToCartDto;

    // 1. Find internal UUID of product
    const [product] = await this.drizzleService.db
      .select()
      .from(productTable)
      .where(eq(productTable.productId, productId))
      .execute();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Insert into cart_items
    await this.drizzleService.db
      .insert(cartItemTable)
      .values({
        userId,
        productId: product.id,
        selectedColor: productColor,
        selectedSize: productSize,
        quantity: prodctQuantity,
        price: product.price,
      })
      .execute();

    return {
      message: 'Added to cart successfully',
    };
  }

  async getCartProducts(userId: string) {
    // 1. Fetch cart items joined with products
    const items = await this.drizzleService.db
      .select({
        cartItemId: cartItemTable.id,
        quantity: cartItemTable.quantity,
        selectedColor: cartItemTable.selectedColor,
        selectedSize: cartItemTable.selectedSize,
        product: productTable,
      })
      .from(cartItemTable)
      .innerJoin(productTable, eq(cartItemTable.productId, productTable.id))
      .where(eq(cartItemTable.userId, userId))
      .execute();

    if (items.length === 0) {
      return [];
    }

    const productIds = items.map((item) => item.product.id);

    // 2. Fetch product images
    const images = await this.drizzleService.db
      .select()
      .from(productImageTable)
      .where(inArray(productImageTable.productId, productIds))
      .execute();

    // 3. Map to match expected client model fields
    return items.map((item) => {
      const prodImages = images.filter(
        (img) => img.productId === item.product.id,
      );
      const productImage = prodImages.length > 0 ? prodImages[0].url : '';

      const basePrice = Number(item.product.price);
      const discountPrice = Number(item.product.discountPrice);
      const qty = item.quantity;
      const finalPrice = discountPrice > 0 ? discountPrice : basePrice;

      return {
        id: item.cartItemId, // cart item primary key to delete it
        productId: item.product.productId, // client side string productId
        productTitle: item.product.title,
        prodctQuantity: qty, // Note: spelling matches client key 'prodctQuantity'
        productColor: item.selectedColor,
        productSize: item.selectedSize,
        productPrice: basePrice,
        discountPrice: discountPrice,
        totalPrice: qty * finalPrice,
        productImage: productImage,
        createdDate: item.product.createdDate.toISOString(),
      };
    });
  }

  async removeCartProduct(userId: string, cartItemId: string) {
    const result = await this.drizzleService.db
      .delete(cartItemTable)
      .where(
        and(eq(cartItemTable.userId, userId), eq(cartItemTable.id, cartItemId)),
      )
      .returning({ id: cartItemTable.id })
      .execute();

    if (result.length === 0) {
      throw new NotFoundException('Cart item not found or unauthorized');
    }

    return {
      message: 'Product removed successfully',
    };
  }

  async isProductInCart(userId: string, productId: string): Promise<boolean> {
    const [product] = await this.drizzleService.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.productId, productId))
      .execute();

    if (!product) return false;

    const [cartItem] = await this.drizzleService.db
      .select({ id: cartItemTable.id })
      .from(cartItemTable)
      .where(
        and(
          eq(cartItemTable.userId, userId),
          eq(cartItemTable.productId, product.id),
        ),
      )
      .execute();

    return !!cartItem;
  }
}
