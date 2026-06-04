import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { orderTable, orderItemTable, orderStatusTable, cartItemTable, productTable } from '../db/schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { eq, inArray, and } from 'drizzle-orm';

@Injectable()
export class OrdersService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { products, shippingAddress, itemCount, totalPrice, code, orderStatus } = createOrderDto;

    // Use a transaction so that we don't end up with partial orders or failing to clear cart
    await this.drizzleService.db.transaction(async (tx) => {
      // 1. Create order record
      const [order] = await tx
        .insert(orderTable)
        .values({
          code,
          userId,
          shippingAddress,
          itemCount,
          totalPrice: totalPrice.toString(),
        })
        .returning({ id: orderTable.id })
        .execute();

      // 2. Add order items & identify cart items to delete
      const cartItemIdsToDelete: string[] = [];

      for (const item of products) {
        // Resolve internal database product ID (UUID)
        const [product] = await tx
          .select({ id: productTable.id })
          .from(productTable)
          .where(eq(productTable.productId, item.productId))
          .execute();

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        // Insert into order_items
        await tx
          .insert(orderItemTable)
          .values({
            orderId: order.id,
            productId: product.id,
            productTitle: item.productTitle,
            productImage: item.productImage,
            selectedColor: item.productColor,
            selectedSize: item.productSize,
            quantity: item.productQuantity,
            price: item.productPrice.toString(),
          })
          .execute();

        // Add to list of cart items to clean up
        cartItemIdsToDelete.push(item.id);
      }

      // 3. Add order status history
      for (const status of orderStatus) {
        await tx
          .insert(orderStatusTable)
          .values({
            orderId: order.id,
            title: status.title,
            isDone: status.done,
            statusDate: new Date(status.createdDate),
          })
          .execute();
      }

      // 4. Clear ordered products from user's shopping cart
      if (cartItemIdsToDelete.length > 0) {
        await tx
          .delete(cartItemTable)
          .where(inArray(cartItemTable.id, cartItemIdsToDelete))
          .execute();
      }
    });

    return {
      message: 'Order registered successfully',
    };
  }

  async getOrders(userId: string) {
    // 1. Fetch user orders
    const orders = await this.drizzleService.db
      .select()
      .from(orderTable)
      .where(eq(orderTable.userId, userId))
      .execute();

    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);

    // 2. Fetch all order items and status histories sequentially
    const orderItems = await this.drizzleService.db
      .select({
        orderItem: orderItemTable,
        productId: productTable.productId,
      })
      .from(orderItemTable)
      .innerJoin(productTable, eq(orderItemTable.productId, productTable.id))
      .where(inArray(orderItemTable.orderId, orderIds))
      .execute();

    const orderStatuses = await this.drizzleService.db
      .select()
      .from(orderStatusTable)
      .where(inArray(orderStatusTable.orderId, orderIds))
      .execute();

    // 3. Map orders and their corresponding relationships
    return orders.map((order) => {
      const items = orderItems
        .filter((item) => item.orderItem.orderId === order.id)
        .map((item) => {
          const basePrice = Number(item.orderItem.price);
          const qty = item.orderItem.quantity;
          
          return {
            id: item.orderItem.id,
            productId: item.productId, // client side string productId
            productTitle: item.orderItem.productTitle,
            prodctQuantity: qty, // spelling maps 1:1 to Flutter client
            productColor: item.orderItem.selectedColor,
            productSize: item.orderItem.selectedSize,
            productPrice: basePrice,
            discountPrice: 0, // not stored/needed on order history, fallback to 0
            totalPrice: basePrice * qty,
            productImage: item.orderItem.productImage,
            createdDate: order.createdDate.toISOString(),
          };
        });

      const statuses = orderStatuses
        .filter((status) => status.orderId === order.id)
        .map((status) => ({
          title: status.title,
          createdDate: status.statusDate.toISOString(),
          done: status.isDone,
        }));

      return {
        shippingAddress: order.shippingAddress,
        itemCount: order.itemCount,
        totalPrice: Number(order.totalPrice),
        code: order.code,
        createdDate: order.createdDate.toISOString(),
        products: items,
        orderStatus: statuses,
      };
    });
  }

  async getOrderTracking(userId: string, codeOrId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(codeOrId);

    const [order] = await this.drizzleService.db
      .select()
      .from(orderTable)
      .where(
        and(
          eq(orderTable.userId, userId),
          isUuid ? eq(orderTable.id, codeOrId) : eq(orderTable.code, codeOrId)
        )
      )
      .execute();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const statuses = await this.drizzleService.db
      .select()
      .from(orderStatusTable)
      .where(eq(orderStatusTable.orderId, order.id))
      .execute();

    return statuses.map((status) => ({
      title: status.title,
      createdDate: status.statusDate.toISOString(),
      done: status.isDone,
    }));
  }
}

