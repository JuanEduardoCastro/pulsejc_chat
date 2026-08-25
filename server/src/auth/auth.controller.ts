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
import { Throttle } from '@nestjs/throttler';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiTags } from '@nestjs/swagger';
import { EmailKeyedThrottlerGuard } from '../common/guards/email-keyed-throttler.guard';

const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // 15 MINUTES
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 DAYS
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private isProduction() {
    return this.config.getOrThrow<string>('CLIENT_URL').startsWith('https');
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const secure = this.isProduction();
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
    });
  }

  private clearAuthCookies(res: Response) {
    const secure = this.isProduction();
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('check-email')
  async checkEmail(@Body() dto: CheckEmailDto) {
    const isAvailable = await this.authService.isEmailAvailable(dto.email);
    if (!isAvailable) {
      throw new ConflictException('Email already in use');
    }
    return { available: true };
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @UseGuards(EmailKeyedThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.refreshToken as string | undefined;
    if (!rawRefreshToken) {
      this.clearAuthCookies(res);
      throw new ConflictException('No refresh token provided');
    }
    const { accessToken, refreshToken, user } =
      await this.authService.refreshTokens(rawRefreshToken);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(
      req.cookies?.refreshToken as string | undefined,
    );
    this.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
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
    const { accessToken, refreshToken } =
      await this.authService.loginWithGoogle(req.user);
    this.setAuthCookies(res, accessToken, refreshToken);
    const clientUrl = this.config.getOrThrow<string>('CLIENT_URL');
    res.redirect(`${clientUrl}/oauth-callback`);
  }
}
