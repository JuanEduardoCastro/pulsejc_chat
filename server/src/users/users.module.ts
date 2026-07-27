import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminController } from './admin.controller';
import { UploadsModule } from '@/uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [UsersController, AdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
