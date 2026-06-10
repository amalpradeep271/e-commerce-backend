import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { eq } from 'drizzle-orm';

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
  console.log('Seeding Irinjalakuda Khadi database...');
  const slug = 'irinjalakuda-khadi';

  try {
    // 1. Clean up existing tenant & users if they exist to support clean re-runs
    const [existingTenant] = await db
      .select({ id: schema.tenantTable.id })
      .from(schema.tenantTable)
      .where(eq(schema.tenantTable.slug, slug))
      .execute();

    if (existingTenant) {
      console.log('Cleaning up existing Irinjalakuda Khadi tenant and associated records...');
      // Cascade delete is defined in schema for categories/products/banners/coupons/notifications linked to tenant,
      // but let's delete them cleanly or let cascade handle it.
      await db.delete(schema.tenantTable).where(eq(schema.tenantTable.id, existingTenant.id)).execute();
      console.log('Existing tenant deleted.');
    }

    // 2. Insert new tenant
    console.log('Inserting tenant...');
    const [newTenant] = await db
      .insert(schema.tenantTable)
      .values({
        slug,
        name: 'Irinjalakuda Khadi',
        tagline: 'Pure Handloom Khadi Materials',
        logoUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop', // nice woven cotton texture/logo
        primaryColor: '#8C5A3C', // earthy brown
        secondaryColor: '#D2B48C', // tan
        fontFamily: 'beVietnamPro',
        currency: 'INR',
        currencySymbol: '₹',
        isActive: true,
      })
      .returning()
      .execute();
    console.log(`Tenant created: ${newTenant.name} (ID: ${newTenant.id})`);

    // 3. Create Admin user
    console.log('Inserting admin user...');
    const adminPasswordHash = await bcrypt.hash('ijkkhadi123', 10);
    const [adminUser] = await db
      .insert(schema.userTable)
      .values({
        firstName: 'Irinjalakuda',
        lastName: 'Khadi Admin',
        email: 'Ijkkhadi@gmail.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        tenantId: newTenant.id,
      })
      .returning()
      .execute();
    console.log(`Admin user created: ${adminUser.email}`);

    // 4. Create Categories
    console.log('Inserting categories...');
    const categoriesData = [
      {
        title: 'Khadi Shirts & Kurtas',
        image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=300&auto=format&fit=crop', // fine shirts
        tenantId: newTenant.id,
      },
      {
        title: 'Khadi Sarees',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300&auto=format&fit=crop', // traditional saree fabric
        tenantId: newTenant.id,
      },
      {
        title: 'Khadi Fabric Materials',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop', // unstitched cotton rolls
        tenantId: newTenant.id,
      },
      {
        title: 'Traditional Dhotis & Mundus',
        image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=300&auto=format&fit=crop', // white traditional wear
        tenantId: newTenant.id,
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

    const shirtsCategory = insertedCategories.find(c => c.title === 'Khadi Shirts & Kurtas');
    const sareesCategory = insertedCategories.find(c => c.title === 'Khadi Sarees');
    const fabricsCategory = insertedCategories.find(c => c.title === 'Khadi Fabric Materials');
    const dhotisCategory = insertedCategories.find(c => c.title === 'Traditional Dhotis & Mundus');

    // 5. Insert Products
    console.log('Inserting products...');
    const productsData = [
      {
        productId: 'ijk_khadi_01',
        categoryId: shirtsCategory?.id,
        tenantId: newTenant.id,
        title: 'Handspun Cotton White Kurta',
        description: 'Traditional handspun and hand-woven 100% white cotton Khadi Kurta. Light, breathable, extremely comfortable, and perfect for festivals, weddings, or formal occasions.',
        dimensions: 'Regular Fit',
        manufactureInformation: 'Handcrafted at Irinjalakuda Khadi Gramodyog weaving centre, Thrissur, Kerala.',
        price: '799.00',
        discountPrice: '699.00',
        gender: 1, // Male
        salesNumber: 35,
        createdDate: new Date(),
        colors: [
          { title: 'Off-White', hexCode: '#FAF9F6' },
          { title: 'Pure White', hexCode: '#FFFFFF' }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        images: [
          'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=500&auto=format&fit=crop'
        ]
      },
      {
        productId: 'ijk_khadi_02',
        categoryId: shirtsCategory?.id,
        tenantId: newTenant.id,
        title: 'Saffron Khadi Half-Sleeve Shirt',
        description: 'A vibrant saffron colored half-sleeve shirt crafted from organic khadi cotton. Features natural coconut-shell buttons, a chest pocket, and a clean Chinese collar.',
        dimensions: 'Slim Fit',
        manufactureInformation: 'Woven by skilled Kerala Khadi weavers using local cotton fibers.',
        price: '650.00',
        discountPrice: '550.00',
        gender: 1, // Male
        salesNumber: 24,
        createdDate: new Date(),
        colors: [
          { title: 'Saffron Orange', hexCode: '#F4C430' }
        ],
        sizes: ['M', 'L', 'XL'],
        images: [
          'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=500&auto=format&fit=crop'
        ]
      },
      {
        productId: 'ijk_khadi_03',
        categoryId: sareesCategory?.id,
        tenantId: newTenant.id,
        title: 'Kerala Kasavu Khadi Saree',
        description: 'Elegant Kerala Kasavu handloom saree made of fine khadi cotton with a beautiful golden zari border. Includes matching unstitched blouse piece.',
        dimensions: '5.5 Meters',
        manufactureInformation: 'Woven by expert traditional weavers at the Irinjalakuda cooperative society, Kerala.',
        price: '2499.00',
        discountPrice: '2199.00',
        gender: 2, // Female
        salesNumber: 15,
        createdDate: new Date(),
        colors: [
          { title: 'Cream & Gold', hexCode: '#FAF0E6' }
        ],
        sizes: ['Free Size'],
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=500&auto=format&fit=crop'
        ]
      },
      {
        productId: 'ijk_khadi_04',
        categoryId: sareesCategory?.id,
        tenantId: newTenant.id,
        title: 'Indigo Block Print Khadi Saree',
        description: 'Beautiful hand block printed indigo blue khadi cotton saree. Features classic motifs made from organic vegetable dye prints.',
        dimensions: '6.2 Meters',
        manufactureInformation: 'Eco-friendly hand dyed and block printed in association with Khadi Board.',
        price: '1899.00',
        discountPrice: '1599.00',
        gender: 2, // Female
        salesNumber: 28,
        createdDate: new Date(),
        colors: [
          { title: 'Indigo Blue', hexCode: '#00416A' }
        ],
        sizes: ['Free Size'],
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=500&auto=format&fit=crop'
        ]
      },
      {
        productId: 'ijk_khadi_05',
        categoryId: fabricsCategory?.id,
        tenantId: newTenant.id,
        title: 'Premium Unstitched Khadi Cotton Fabric',
        description: 'High-quality, handspun unstitched plain khadi cotton fabric. Ideal for stitching custom shirts, kurtas, or salwar suits. Priced per meter.',
        dimensions: 'Per Meter (44 inch width)',
        manufactureInformation: 'Spun on traditional charkha and woven in certified Rural Khadi centres.',
        price: '180.00',
        discountPrice: '150.00',
        gender: 0, // Unisex
        salesNumber: 12,
        createdDate: new Date(),
        colors: [
          { title: 'Natural Khadi Beige', hexCode: '#F5F5DC' },
          { title: 'Off-White', hexCode: '#FAF9F6' }
        ],
        sizes: ['1 Meter', '2 Meters', '5 Meters'],
        images: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=500&auto=format&fit=crop'
        ]
      },
      {
        productId: 'ijk_khadi_06',
        categoryId: dhotisCategory?.id,
        tenantId: newTenant.id,
        title: 'Traditional Golden Kasavu Double Mundu',
        description: 'Classic double mundu woven from soft khadi cotton with an elegant golden border. The perfect ethnic attire for festivals, temples, and formal ceremonies in Kerala.',
        dimensions: '4.0 meters x 1.25 meters',
        manufactureInformation: 'Directly sourced from Irinjalakuda Khadi weavers cooperative society.',
        price: '850.00',
        discountPrice: '750.00',
        gender: 1, // Male
        salesNumber: 42,
        createdDate: new Date(),
        colors: [
          { title: 'Cream & Gold', hexCode: '#FAF0E6' }
        ],
        sizes: ['Double Mundu (4m)'],
        images: [
          'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=500&auto=format&fit=crop'
        ]
      }
    ];

    for (const prod of productsData) {
      const [insertedProduct] = await db
        .insert(schema.productTable)
        .values({
          productId: prod.productId,
          categoryId: prod.categoryId,
          tenantId: prod.tenantId,
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
    console.log('Inserted products and relations.');

    // 6. Create Promotion Banner
    console.log('Inserting promotion banner...');
    await db
      .insert(schema.bannerTable)
      .values({
        discountAmount: '20% OFF',
        title: 'Irinjalakuda Khadi\nSpecial Handloom Sale',
        subtitle: 'TRADITIONAL KERALA WEAVES',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
        tenantId: newTenant.id,
      })
      .execute();
    console.log('Inserted promotion banner.');

    console.log('Seeding Irinjalakuda Khadi completed successfully!');
  } catch (error) {
    console.error('Seeding Irinjalakuda Khadi failed:', error);
  } finally {
    await pool.end();
  }
}

main();
