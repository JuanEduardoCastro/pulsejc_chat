import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CurrentUser } from '@/auth/current-user.decorator';
import { AddContactDto } from './dto/add-contact.dto';
import type { User } from '../../generated/prisma/client';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  createContact(@CurrentUser() user: User, @Body() dto: AddContactDto) {
    return this.contactsService.createContact(user.id, dto.email);
  }

  @Get()
  findMany(@CurrentUser() user: User, @Query() query: ListContactsQueryDto) {
    return this.contactsService.findMany(user.id, query.status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') contactId: string) {
    return this.contactsService.findOne(user.id, contactId);
  }

  @Patch(':id/accept')
  acceptContact(@CurrentUser() user: User, @Param('id') contactId: string) {
    return this.contactsService.acceptContact(user.id, contactId);
  }

  @Delete(':id')
  removeContact(@CurrentUser() user: User, @Param('id') contactId: string) {
    return this.contactsService.removeContact(user.id, contactId);
  }
}
