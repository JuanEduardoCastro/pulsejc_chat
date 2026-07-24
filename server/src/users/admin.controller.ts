import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { UsersService } from './users.service';
import { sanitizeUser } from './users.util';

@UseGuards(AdminGuard)
@Controller('admin/users')
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(sanitizeUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
