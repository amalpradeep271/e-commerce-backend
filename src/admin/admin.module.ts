import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [DbModule, CloudinaryModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
