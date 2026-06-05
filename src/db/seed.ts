import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in the environment variables!');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle({ client: pool, schema });

async function main() {
  console.log('Seeding database...');

  try {
    // 0. Clean up existing database records
    console.log('Cleaning up existing database records...');
    await db.delete(schema.bannerTable).execute();
    await db.delete(schema.cartItemTable).execute();
    await db.delete(schema.wishlistTable).execute();
    await db.delete(schema.favoriteTable).execute();
    await db.delete(schema.reviewTable).execute();
    await db.delete(schema.orderItemTable).execute();
    await db.delete(schema.orderStatusTable).execute();
    await db.delete(schema.orderTable).execute();
    await db.delete(schema.productImageTable).execute();
    await db.delete(schema.productColorTable).execute();
    await db.delete(schema.productSizeTable).execute();
    await db.delete(schema.productTable).execute();
    await db.delete(schema.categoryTable).execute();
    await db.delete(schema.ageTable).execute();
    await db.delete(schema.userTable).execute();
    console.log('Database records cleaned up.');

    // 0.5. Seed Users
    console.log('Inserting users...');
    const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
    const userPasswordHash = await bcrypt.hash('userpassword', 10);
    await db
      .insert(schema.userTable)
      .values([
        {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@ecommerce.com',
          passwordHash: adminPasswordHash,
          role: 'admin',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@ecommerce.com',
          passwordHash: userPasswordHash,
          role: 'user',
        },
      ])
      .execute();
    console.log('Users seeded.');

    // 1. Seed Age Ranges
    console.log('Inserting age ranges...');
    const insertedAges = await db
      .insert(schema.ageTable)
      .values([
        { value: '18-24' },
        { value: '25-34' },
        { value: '35-44' },
        { value: '45-54' },
        { value: '55+' },
      ])
      .onConflictDoNothing()
      .returning()
      .execute();
    console.log(`Inserted ${insertedAges.length} age ranges.`);

    // 2. Seed Categories
    console.log('Inserting categories...');
    const categoriesData = [
      {
        title: 'Hoodies',
        image:
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop',
      },
      {
        title: 'Shorts',
        image:
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=300&auto=format&fit=crop',
      },
      {
        title: 'Shoes',
        image:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&auto=format&fit=crop',
      },
      {
        title: 'Bags',
        image:
          'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=300&auto=format&fit=crop',
      },
      {
        title: 'Accessories',
        image:
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300&auto=format&fit=crop',
      },
    ];

    const insertedCategories: any[] = [];
    for (const cat of categoriesData) {
      const [inserted] = await db
        .insert(schema.categoryTable)
        .values(cat)
        .returning()
        .execute();
      insertedCategories.push(inserted);
    }
    console.log(`Inserted ${insertedCategories.length} categories.`);

    const hoodieCategory = insertedCategories.find(
      (c) => c.title === 'Hoodies',
    );
    const shoesCategory = insertedCategories.find((c) => c.title === 'Shoes');
    const shortsCategory = insertedCategories.find((c) => c.title === 'Shorts');
    const bagsCategory = insertedCategories.find((c) => c.title === 'Bags');
    const accessoriesCategory = insertedCategories.find(
      (c) => c.title === 'Accessories',
    );

    // 3. Seed Products
    console.log('Inserting products...');
    const productsData = [
      {
        productId: 'prod_01',
        categoryId: hoodieCategory?.id,
        title: 'Premium Cotton Hoodie',
        description:
          'Stay warm and stylish with our premium cotton blend hoodie. Features a double-lined hood and a spacious kangaroo pocket.',
        dimensions: 'Regular Fit',
        manufactureInformation:
          'Made with 80% Organic Cotton and 20% Recycled Polyester in Vietnam.',
        price: '59.99',
        discountPrice: '45.00',
        gender: 1, // Unisex/Male
        salesNumber: 40, // Top Selling only (>= 22)
        createdDate: new Date('2024-05-01T12:00:00Z'), // Old date (< July 25)
        colors: [
          { title: 'Black', hexCode: '#000000' },
          { title: 'Grey', hexCode: '#808080' },
          { title: 'Navy', hexCode: '#000080' },
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=500&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_02',
        categoryId: shoesCategory?.id,
        title: 'Retro Running Sneakers',
        description:
          'Classic lightweight runner sneakers featuring synthetic suede overlays, breathable mesh base, and durable rubber waffle outsole.',
        dimensions: 'True to Size',
        manufactureInformation: 'Crafted with premium materials in Indonesia.',
        price: '110.00',
        discountPrice: '89.99',
        gender: 1,
        salesNumber: 10, // New In only (< 22)
        createdDate: new Date('2024-08-10T12:00:00Z'), // New In (>= July 25)
        colors: [
          { title: 'Red', hexCode: '#FF0000' },
          { title: 'Blue', hexCode: '#0000FF' },
          { title: 'White', hexCode: '#FFFFFF' },
        ],
        sizes: ['US 8', 'US 9', 'US 10', 'US 11'],
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=500&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_03',
        categoryId: shortsCategory?.id,
        title: 'Active Tech Shorts',
        description:
          'Designed for high performance. Moisture-wicking quick-dry fabric with built-in compression liner and zippered pocket.',
        dimensions: 'Athletic Fit',
        manufactureInformation: 'Engineered in Taiwan.',
        price: '34.99',
        discountPrice: '0.00', // No discount
        gender: 1,
        salesNumber: 12, // Neither (< 22)
        createdDate: new Date('2024-05-15T12:00:00Z'), // Neither (< July 25)
        colors: [
          { title: 'Black', hexCode: '#000000' },
          { title: 'Olive', hexCode: '#556B2F' },
        ],
        sizes: ['S', 'M', 'L'],
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_04',
        categoryId: hoodieCategory?.id,
        title: 'Oversized Fleece Pullover',
        description:
          'Relaxed oversized fit pullover hoodie made from ultra-soft heavyweight fleece. Dropped shoulders and ribbed trims.',
        dimensions: 'Loose Fit',
        manufactureInformation: 'Manufactured in Turkey.',
        price: '79.99',
        discountPrice: '65.00',
        gender: 2, // Female
        salesNumber: 35, // Top Selling only (>= 22)
        createdDate: new Date('2024-06-01T12:00:00Z'), // Old date (< July 25)
        colors: [
          { title: 'Beige', hexCode: '#F5F5DC' },
          { title: 'Sage', hexCode: '#9C9F84' },
        ],
        sizes: ['XS', 'S', 'M', 'L'],
        images: [
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_05',
        categoryId: hoodieCategory?.id,
        title: 'Zip-up Athletic Hoodie',
        description:
          'Performance zip-up hoodie with sweat-wicking materials and reflective design elements for night runners.',
        dimensions: 'Athletic Slim Fit',
        manufactureInformation:
          'Made with 100% recycled polyester in Thailand.',
        price: '69.99',
        discountPrice: '0.00',
        gender: 1,
        salesNumber: 8, // New In only (< 22)
        createdDate: new Date('2024-08-15T12:00:00Z'), // New In (>= July 25)
        colors: [
          { title: 'Navy', hexCode: '#000080' },
          { title: 'Charcoal', hexCode: '#36454F' },
        ],
        sizes: ['M', 'L', 'XL'],
        images: [
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_06',
        categoryId: hoodieCategory?.id,
        title: 'Vintage Knit Hoodie',
        description:
          'Cozy waffle knit texture vintage style hoodie. Super soft feel with a relaxed hem.',
        dimensions: 'Relaxed Fit',
        manufactureInformation: 'Knitted and crafted in India.',
        price: '49.99',
        discountPrice: '39.99',
        gender: 2,
        salesNumber: 15, // Neither (< 22)
        createdDate: new Date('2024-06-10T12:00:00Z'), // Neither (< July 25)
        colors: [
          { title: 'Cream', hexCode: '#FFFDD0' },
          { title: 'Olive', hexCode: '#556B2F' },
        ],
        sizes: ['S', 'M', 'L'],
        images: [
          'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_07',
        categoryId: shortsCategory?.id,
        title: 'Casual Linen Shorts',
        description:
          'Lightweight and breathable linen shorts, perfect for hot summer days. Features an elastic waistband with drawcord.',
        dimensions: 'Regular Fit',
        manufactureInformation:
          '100% pure linen sourced and assembled in Italy.',
        price: '45.00',
        discountPrice: '35.00',
        gender: 1,
        salesNumber: 45, // Top Selling only (>= 22)
        createdDate: new Date('2024-04-15T12:00:00Z'), // Old date (< July 25)
        colors: [
          { title: 'Sand', hexCode: '#C2B280' },
          { title: 'White', hexCode: '#FFFFFF' },
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_08',
        categoryId: shortsCategory?.id,
        title: 'Denim Raw Hem Shorts',
        description:
          'Classic 5-pocket denim shorts featuring a vintage wash and raw fringed hems. Durable denim fabric.',
        dimensions: 'Regular Fit',
        manufactureInformation: 'Stitched in Mexico.',
        price: '49.99',
        discountPrice: '0.00',
        gender: 2,
        salesNumber: 15, // New In only (< 22)
        createdDate: new Date('2024-08-05T12:00:00Z'), // New In (>= July 25)
        colors: [
          { title: 'Light Blue', hexCode: '#ADD8E6' },
          { title: 'Dark Indigo', hexCode: '#4B0082' },
        ],
        sizes: ['XS', 'S', 'M', 'L'],
        images: [
          'https://images.unsplash.com/photo-1582552938357-32b906df43c3?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_09',
        categoryId: shoesCategory?.id,
        title: 'Classic White Leather Sneakers',
        description:
          'Minimalist daily leather sneakers that go with any outfit. Soft calfskin leather lining with supportive cupsole.',
        dimensions: 'True to Size',
        manufactureInformation: 'Handcrafted in Portugal.',
        price: '125.00',
        discountPrice: '99.99',
        gender: 1,
        salesNumber: 55, // Both (>= 22)
        createdDate: new Date('2024-08-12T12:00:00Z'), // Both (>= July 25)
        colors: [
          { title: 'White', hexCode: '#FFFFFF' },
          { title: 'Off-White', hexCode: '#FAF9F6' },
        ],
        sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'],
        images: [
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_10',
        categoryId: shoesCategory?.id,
        title: 'All-Weather Trail Boots',
        description:
          'Waterproof suede trail boots with Vibram outsoles for maximum traction. Engineered for rugged environments.',
        dimensions: 'Slightly Wide Fit',
        manufactureInformation: 'Assembled in Vietnam.',
        price: '160.00',
        discountPrice: '0.00',
        gender: 1,
        salesNumber: 18, // Neither (< 22)
        createdDate: new Date('2024-07-01T12:00:00Z'), // Neither (< July 25)
        colors: [
          { title: 'Brown', hexCode: '#964B00' },
          { title: 'Sand', hexCode: '#C2B280' },
        ],
        sizes: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
        images: [
          'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_11',
        categoryId: bagsCategory?.id,
        title: 'Waterproof Rolltop Backpack',
        description:
          'Spacious and fully waterproof rolltop bag, perfect for commuters. Features an internal padded 16-inch laptop sleeve.',
        dimensions: '25L Capacity',
        manufactureInformation: 'Made with recycled TPU coating in China.',
        price: '85.00',
        discountPrice: '69.00',
        gender: 1,
        salesNumber: 48, // Top Selling only (>= 22)
        createdDate: new Date('2024-03-20T12:00:00Z'), // Old date (< July 25)
        colors: [
          { title: 'Matte Black', hexCode: '#1A1A1A' },
          { title: 'Olive Green', hexCode: '#3B533E' },
        ],
        sizes: ['One Size'],
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_12',
        categoryId: bagsCategory?.id,
        title: 'Minimalist Leather Tote',
        description:
          'Crafted from premium full-grain pebbled leather. Elegant and clean shoulder bag design with solid brass hardware.',
        dimensions: 'Medium Tote',
        manufactureInformation: 'Crafted in Spain.',
        price: '140.00',
        discountPrice: '0.00',
        gender: 2,
        salesNumber: 5, // New In only (< 22)
        createdDate: new Date('2024-08-22T12:00:00Z'), // New In (>= July 25)
        colors: [
          { title: 'Tan Leather', hexCode: '#B87333' },
          { title: 'Noir', hexCode: '#0D0D0D' },
        ],
        sizes: ['One Size'],
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_13',
        categoryId: accessoriesCategory?.id,
        title: 'Polarized Classic Sunglasses',
        description:
          'Acetate frame classic square sunglasses with UV400 polarized lenses. Durable 5-barrel hinges.',
        dimensions: 'Standard Fit',
        manufactureInformation: 'Designed in Japan.',
        price: '39.99',
        discountPrice: '29.99',
        gender: 1,
        salesNumber: 60, // Both (>= 22)
        createdDate: new Date('2024-08-11T12:00:00Z'), // Both (>= July 25)
        colors: [
          { title: 'Tortoise/Green', hexCode: '#556B2F' },
          { title: 'Black/Dark Grey', hexCode: '#111111' },
        ],
        sizes: ['One Size'],
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=500&auto=format&fit=crop',
        ],
      },
      {
        productId: 'prod_14',
        categoryId: accessoriesCategory?.id,
        title: 'Sport Silicone Smartwatch',
        description:
          'Fitness smartwatch with heart rate monitoring, sleep tracking, and a durable sweatproof silicone band.',
        dimensions: '44mm Case',
        manufactureInformation: 'Assembled in South Korea.',
        price: '89.99',
        discountPrice: '75.00',
        gender: 1,
        salesNumber: 38, // Both (>= 22)
        createdDate: new Date('2024-08-18T12:00:00Z'), // Both (>= July 25)
        colors: [
          { title: 'Slate Grey', hexCode: '#708090' },
          { title: 'Blush Pink', hexCode: '#FFC0CB' },
        ],
        sizes: ['One Size'],
        images: [
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=500&auto=format&fit=crop',
        ],
      },
    ];

    for (const prod of productsData) {
      const [insertedProduct] = await db
        .insert(schema.productTable)
        .values({
          productId: prod.productId,
          categoryId: prod.categoryId,
          title: prod.title,
          description: prod.description,
          dimensions: prod.dimensions,
          manufactureInformation: prod.manufactureInformation,
          price: prod.price,
          discountPrice: prod.discountPrice,
          gender: prod.gender,
          salesNumber: prod.salesNumber,
          createdDate: prod.createdDate,
        })
        .returning()
        .execute();

      // Seed colors
      for (const col of prod.colors) {
        await db
          .insert(schema.productColorTable)
          .values({
            productId: insertedProduct.id,
            title: col.title,
            hexCode: col.hexCode,
          })
          .execute();
      }

      // Seed sizes
      for (const sz of prod.sizes) {
        await db
          .insert(schema.productSizeTable)
          .values({
            productId: insertedProduct.id,
            size: sz,
          })
          .execute();
      }

      // Seed images
      for (const img of prod.images) {
        await db
          .insert(schema.productImageTable)
          .values({
            productId: insertedProduct.id,
            url: img,
          })
          .execute();
      }
    }
    console.log('Inserted products and their relations.');

    // 4. Seed Banners
    console.log('Inserting promotion banners...');
    await db
      .insert(schema.bannerTable)
      .values([
        {
          discountAmount: '50% OFF',
          image:
            'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
        },
        {
          discountAmount: '30% OFF',
          image:
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
        },
      ])
      .execute();
    console.log('Inserted promotion banners.');

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

main();
