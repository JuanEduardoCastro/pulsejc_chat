import { Module } from '@nestjs/common';
import { UsersModule } from '@/users/users.module';
import { BillingModule } from '@/billing/billing.module';
import { DemoService } from './demo.service';

@Module({
  imports: [UsersModule, BillingModule],
  providers: [DemoService],
})
export class DemoModule {}
