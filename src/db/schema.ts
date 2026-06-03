import { pgTable, varchar, uuid, boolean, timestamp, integer, numeric, text } from 'drizzle-orm/pg-core';

// 1. Users Table
export const userTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  email: varchar('email').notNull().unique(),
  passwordHash: varchar('password_hash').notNull(),
  image: varchar('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Ages Table (for user signup metadata)
export const ageTable = pgTable('ages', {
  id: uuid('id').defaultRandom().primaryKey(),
  value: varchar('value').notNull().unique(), // e.g. "18-24", "25-34"
});

// 3. Categories Table
export const categoryTable = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title').notNull(),
  image: varchar('image').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Products Table
export const productTable = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: varchar('product_id').notNull().unique(), // maps 1:1 to frontend's productId field
  categoryId: uuid('category_id').references(() => categoryTable.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(),
  description: text('description').notNull(),
  dimensions: varchar('dimensions').notNull(),
  manufactureInformation: text('manufacture_information').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  discountPrice: numeric('discount_price', { precision: 10, scale: 2 }).notNull(),
  gender: integer('gender').notNull(), // numeric representation of gender (e.g. 0/1/2)
  salesNumber: integer('sales_number').default(0).notNull(),
  createdDate: timestamp('created_date').defaultNow().notNull(), // maps to createdDate field in Flutter ProductModel
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Product Images Table
export const productImageTable = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => productTable.id, { onDelete: 'cascade' }),
  url: varchar('url').notNull(),
});

// 6. Product Colors Table
export const productColorTable = pgTable('product_colors', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => productTable.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(), // e.g. "Red"
  hexCode: varchar('hex_code').notNull(), // e.g. "#FF0000"
});

// 7. Product Sizes Table
export const productSizeTable = pgTable('product_sizes', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => productTable.id, { onDelete: 'cascade' }),
  size: varchar('size').notNull(), // e.g. "S", "M", "L", "XL"
});

// 8. Banners Table (Home Screen Carousel)
export const bannerTable = pgTable('banners', {
  id: uuid('id').defaultRandom().primaryKey(),
  image: varchar('image').notNull(),
  discountAmount: varchar('discount_amount').notNull(), // e.g. "50% OFF"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Cart Items Table
export const cartItemTable = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => productTable.id, { onDelete: 'cascade' }),
  selectedColor: varchar('selected_color').notNull(),
  selectedSize: varchar('selected_size').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Orders Table
export const orderTable = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code').notNull().unique(), // e.g. "ORD-12345"
  userId: uuid('user_id').notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  shippingAddress: varchar('shipping_address').notNull(),
  itemCount: integer('item_count').notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  createdDate: timestamp('created_date').defaultNow().notNull(), // maps to createdDate field in Flutter OrderModel
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 11. Order Items Table
export const orderItemTable = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orderTable.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => productTable.id),
  productTitle: varchar('product_title').notNull(),
  productImage: varchar('product_image').notNull(),
  selectedColor: varchar('selected_color').notNull(),
  selectedSize: varchar('selected_size').notNull(),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
});

// 12. Order Status Table (Tracking updates)
export const orderStatusTable = pgTable('order_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orderTable.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(), // e.g. "Order Placed", "Shipped", "Delivered"
  statusDate: timestamp('status_date').defaultNow().notNull(),
  isDone: boolean('is_done').default(false).notNull(),
});

// 13. Wishlist Table (User Favorites)
export const wishlistTable = pgTable('wishlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => productTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Reviews Table
export const reviewTable = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => productTable.id, { onDelete: 'cascade' }),
  title: varchar('title'),
  content: text('content'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull(), // e.g. 4.50
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. Favorites Table (separate from Wishlist)
export const favoriteTable = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => productTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

