import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { PresenceService } from './presence.service';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ChatController],
  providers: [
    ConversationsService,
    MessagesService,
    ChatGateway,
    PresenceService,
  ],
  exports: [ConversationsService],
})
export class ChatModule {}
