import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '../../generated/prisma/client';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: User) {
    return this.conversationsService.listForUser(user.id);
  }

  @Get('conversations/:id/messages')
  listMessages(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.messagesService.listForConversation(
      conversationId,
      user.id,
      query.cursor,
      query.limit,
    );
  }

  @Delete('conversations/:id')
  hideConversation(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
  ) {
    return this.conversationsService.hideForUser(conversationId, user.id);
  }
}
