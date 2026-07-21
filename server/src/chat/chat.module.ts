import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { ChatController } from './chat.controller';

@Module({
  controllers: [ChatController],
  providers: [ConversationsService, MessagesService],
  exports: [ConversationsService],
})
export class ChatModule {}
