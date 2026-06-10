import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { TenantsController } from './tenants.controller';
import { SuperAdminController } from './super-admin.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [DbModule],
  controllers: [TenantsController, SuperAdminController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
