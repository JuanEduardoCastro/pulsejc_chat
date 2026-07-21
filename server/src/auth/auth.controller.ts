import {
  Controller,
  Post,
  Body,
  ConflictException,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { CheckEmailDto } from './dto/check-email.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleProfile } from './google.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport intercepts this request and redirects to Google's consent screen.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const { accessToken } = await this.authService.loginWithGoogle(req.user);
    const clientUrl = this.config.getOrThrow<string>('CLIENT_URL');
    res.redirect(`${clientUrl}/oauth-callback?token=${accessToken}`);
  }
}
