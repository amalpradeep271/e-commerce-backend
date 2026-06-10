import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DrizzleService } from '../../db/db.service';
import { tenantTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TenantGuard implements CanActivate {
  private defaultTenantId: string | null = null;

  constructor(private readonly drizzleService: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Resolve tenant ID from X-Tenant-Slug header
    const tenantSlug = request.headers['x-tenant-slug'];
    let resolvedTenantId: string | null = null;

    if (tenantSlug) {
      const [tenant] = await this.drizzleService.db
        .select({ id: tenantTable.id })
        .from(tenantTable)
        .where(eq(tenantTable.slug, tenantSlug.toString()))
        .execute();

      if (!tenant) {
        throw new BadRequestException(`Invalid tenant slug: ${tenantSlug}`);
      }
      resolvedTenantId = tenant.id;
    }

    // 2. If no header, check authenticated user's tenantId (from JWT)
    if (!resolvedTenantId && request.user && request.user.tenantId) {
      resolvedTenantId = request.user.tenantId;
    }

    // 3. Fallback to default 'khadi' tenant to maintain backward compatibility
    if (!resolvedTenantId) {
      if (!this.defaultTenantId) {
        const [khadi] = await this.drizzleService.db
          .select({ id: tenantTable.id })
          .from(tenantTable)
          .where(eq(tenantTable.slug, 'khadi'))
          .execute();
        if (khadi) {
          this.defaultTenantId = khadi.id;
        }
      }
      resolvedTenantId = this.defaultTenantId;
    }

    // 4. If user is logged in, verify they belong to the resolved tenant
    // (Admins can only access their own tenant, users can only access their own tenant)
    // Note: Super admin users (no tenantId/null tenantId) can access any tenant.
    if (
      request.user &&
      request.user.tenantId &&
      request.user.tenantId !== resolvedTenantId
    ) {
      throw new ForbiddenException('You do not have permission to access this tenant\'s data');
    }

    // Attach resolved tenantId to the request object
    request.tenantId = resolvedTenantId;

    return true;
  }
}
