import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [UsersModule, ChatModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
