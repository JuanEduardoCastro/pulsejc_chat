import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { PresenceService } from './presence.service';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { AiModule } from '@/ai/ai.module';

@Module({
  imports: [AuthModule, UsersModule, AiModule],
  controllers: [ChatController],
  providers: [
    ConversationsService,
    MessagesService,
    ChatGateway,
    PresenceService,
  ],
  exports: [ConversationsService, ChatGateway],
})
export class ChatModule {}
