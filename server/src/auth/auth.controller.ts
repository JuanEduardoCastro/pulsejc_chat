import { Controller, Post, Body, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CheckEmailDto } from './dto/check-email.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check-email')
  async checkEmail(@Body() dto: CheckEmailDto) {
    const isAvailable = await this.authService.isEmailAvailable(dto.email);
    if (!isAvailable) {
      throw new ConflictException('Email already in use');
    }
    return { available: true };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
