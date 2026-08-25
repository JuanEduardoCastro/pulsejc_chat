import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { sanitizeUser } from '@/users/users.util';
import { User } from '../../generated/prisma/browser';
import { LoginDto } from './dto/login.dto';
import { GoogleProfile } from './google.strategy';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { I18nService } from 'nestjs-i18n';

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_REFRESH_TOKENS_PER_USER = 2;
const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If that email is registered, you will receive instructions shortly.';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
  ) {}

  async isEmailAvailable(email: string) {
    const existingUser = await this.userService.findByEmail(email);
    return !existingUser;
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const newUser = await this.userService.create({
      email: dto.email,
      passwordHash: passwordHash,
    });

    return await this.buildAuthResponse(newUser);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return await this.buildAuthResponse(user);
  }

  async loginWithGoogle(googleProfile: GoogleProfile) {
    let user = await this.userService.findByGoogleId(googleProfile.googleId);
    if (!user) {
      const existingUser = await this.userService.findByEmail(
        googleProfile.email,
      );
      user = existingUser
        ? await this.userService.linkGoogleAccount(
            existingUser.id,
            googleProfile.googleId,
          )
        : await this.userService.create({
            email: googleProfile.email,
            googleId: googleProfile.googleId,
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            avatarURL: googleProfile.avatarUrl,
          });
    }
    return await this.buildAuthResponse(user);
  }

  async refreshTokens(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { tokenHash } });

    const user = await this.userService.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return await this.buildAuthResponse(user);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    await this.prisma.refreshToken
      .delete({ where: { tokenHash: this.hashToken(rawRefreshToken) } })
      .catch(() => undefined);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (user && !user.passwordHash) {
      await this.mailService.send(
        user.email,
        this.i18n.t('mail.googleAccount.subject', { lang: user.locale }),
        this.i18n.t('mail.googleAccount.body', { lang: user.locale }),
      );
    } else if (user) {
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const token = crypto.randomBytes(32).toString('hex');
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${this.config.getOrThrow<string>('CLIENT_URL')}/reset-password?token=${token}`;

      await this.mailService.send(
        user.email,
        this.i18n.t('mail.resetPassword.subject', { lang: user.locale }),
        this.i18n.t('mail.resetPassword.body', {
          lang: user.locale,
          args: { resetUrl },
        }),
      );
    }
    return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.userService.updatePassword(resetToken.userId, passwordHash);
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });
    await this.prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    return { message: 'Password has been reset successfully' };
  }

  /* ------ */

  private async buildAuthResponse(user: User) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    const refreshToken = await this.issueRefreshToken(user.id);
    return { accessToken, refreshToken, user: sanitizeUser(user) };
  }

  private async issueRefreshToken(userId: string) {
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    });

    if (activeTokens.length >= MAX_REFRESH_TOKENS_PER_USER) {
      await this.prisma.refreshToken.delete({
        where: { id: activeTokens[0].id },
      });
    }

    const rawToken = crypto.randomBytes(48).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return rawToken;
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
