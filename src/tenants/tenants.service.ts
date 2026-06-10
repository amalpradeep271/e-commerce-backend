import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { tenantTable, userTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { OnboardBrandDto } from './dto/onboard-brand.dto';
import { UpdateBrandSettingsDto } from './dto/update-brand-settings.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getTenantConfig(slug: string) {
    const [tenant] = await this.drizzleService.db
      .select()
      .from(tenantTable)
      .where(eq(tenantTable.slug, slug))
      .execute();

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug '${slug}' not found`);
    }

    if (!tenant.isActive) {
      throw new NotFoundException(`Tenant with slug '${slug}' is inactive`);
    }

    // Format settings for the frontend config
    return {
      slug: tenant.slug,
      name: tenant.name,
      tagline: tenant.tagline ?? '',
      logoUrl: tenant.logoUrl ?? '',
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      fontFamily: tenant.fontFamily ?? 'beVietnamPro',
      currency: tenant.currency ?? 'INR',
      currencySymbol: tenant.currencySymbol ?? '₹',
    };
  }

  async onboardBrand(dto: OnboardBrandDto) {
    const {
      slug,
      name,
      tagline,
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      currency,
      currencySymbol,
      adminEmail,
      adminPassword,
    } = dto;

    // 1. Check if slug exists
    const [existingTenant] = await this.drizzleService.db
      .select({ id: tenantTable.id })
      .from(tenantTable)
      .where(eq(tenantTable.slug, slug))
      .execute();

    if (existingTenant) {
      throw new ConflictException(`Tenant with slug '${slug}' already exists`);
    }

    // 2. Check if email exists
    const [existingUser] = await this.drizzleService.db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, adminEmail))
      .execute();

    if (existingUser) {
      throw new ConflictException(`An account already exists with email '${adminEmail}'`);
    }

    // 3. Password prep
    const password = adminPassword || Math.random().toString(36).substring(2, 10);
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Run database transaction to insert tenant and its admin user
    return this.drizzleService.db.transaction(async (tx) => {
      const [newTenant] = await tx
        .insert(tenantTable)
        .values({
          slug,
          name,
          tagline,
          logoUrl,
          primaryColor: primaryColor || '#4F378A',
          secondaryColor: secondaryColor || '#6750A4',
          fontFamily: fontFamily || 'beVietnamPro',
          currency: currency || 'INR',
          currencySymbol: currencySymbol || '₹',
          isActive: true,
        })
        .returning()
        .execute();

      const [newAdmin] = await tx
        .insert(userTable)
        .values({
          firstName: name,
          lastName: 'Admin',
          email: adminEmail,
          passwordHash,
          role: 'admin',
          tenantId: newTenant.id,
        })
        .returning()
        .execute();

      return {
        message: 'Tenant and admin created successfully',
        tenantId: newTenant.id,
        tenantSlug: newTenant.slug,
        adminEmail: newAdmin.email,
        temporaryPassword: password,
      };
    });
  }

  async updateBrandSettings(userId: string, tenantId: string, dto: UpdateBrandSettingsDto) {
    let activeTenantId = tenantId;
    let tenant: any = null;

    if (activeTenantId) {
      const [existingTenant] = await this.drizzleService.db
        .select()
        .from(tenantTable)
        .where(eq(tenantTable.id, activeTenantId))
        .execute();
      tenant = existingTenant;
    }

    if (!tenant) {
      // Create a default tenant since this user has no tenant associated yet
      const [newTenant] = await this.drizzleService.db
        .insert(tenantTable)
        .values({
          slug: 'default-brand',
          name: dto.name || 'Default Brand',
          tagline: dto.tagline || '',
          logoUrl: dto.logoUrl || '',
          primaryColor: dto.primaryColor || '#4F378A',
          secondaryColor: dto.secondaryColor || '#6750A4',
          fontFamily: dto.fontFamily || 'beVietnamPro',
          currency: dto.currency || 'INR',
          currencySymbol: dto.currencySymbol || '₹',
          isActive: true,
        })
        .returning()
        .execute();

      tenant = newTenant;
      activeTenantId = newTenant.id;

      // Associate user with this new tenant
      await this.drizzleService.db
        .update(userTable)
        .set({ tenantId: activeTenantId })
        .where(eq(userTable.id, userId))
        .execute();
    }

    const [updated] = await this.drizzleService.db
      .update(tenantTable)
      .set({
        name: dto.name,
        tagline: dto.tagline,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        fontFamily: dto.fontFamily,
        currency: dto.currency,
        currencySymbol: dto.currencySymbol,
      })
      .where(eq(tenantTable.id, activeTenantId))
      .returning()
      .execute();

    return {
      slug: updated.slug,
      name: updated.name,
      tagline: updated.tagline ?? '',
      logoUrl: updated.logoUrl ?? '',
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
      fontFamily: updated.fontFamily ?? 'beVietnamPro',
      currency: updated.currency ?? 'INR',
      currencySymbol: updated.currencySymbol ?? '₹',
    };
  }

  async getTenantConfigById(tenantId: string) {
    if (!tenantId) {
      return {
        slug: 'default-brand',
        name: 'Default Brand',
        tagline: '',
        logoUrl: '',
        primaryColor: '#4F378A',
        secondaryColor: '#6750A4',
        fontFamily: 'beVietnamPro',
        currency: 'INR',
        currencySymbol: '₹',
      };
    }

    const [tenant] = await this.drizzleService.db
      .select()
      .from(tenantTable)
      .where(eq(tenantTable.id, tenantId))
      .execute();

    if (!tenant) {
      return {
        slug: 'default-brand',
        name: 'Default Brand',
        tagline: '',
        logoUrl: '',
        primaryColor: '#4F378A',
        secondaryColor: '#6750A4',
        fontFamily: 'beVietnamPro',
        currency: 'INR',
        currencySymbol: '₹',
      };
    }

    return {
      slug: tenant.slug,
      name: tenant.name,
      tagline: tenant.tagline ?? '',
      logoUrl: tenant.logoUrl ?? '',
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      fontFamily: tenant.fontFamily ?? 'beVietnamPro',
      currency: tenant.currency ?? 'INR',
      currencySymbol: tenant.currencySymbol ?? '₹',
    };
  }
}
