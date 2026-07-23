import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
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
  ) {}

  async isEmailAvailable(email: string) {
    const existingUser = await this.userService.findByEmail(email);
    return !existingUser;
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const newUser = await this.userService.create({
      email: dto.email,
      passwordHash: passwordHash,
    });

    return this.buildAuthResponse(newUser);
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
    return this.buildAuthResponse(user);
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
    return this.buildAuthResponse(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (user && !user.passwordHash) {
      await this.mailService.send(
        user.email,
        'Pulse.Jc - Password Reset',
        `<p>Your Pulse.Jc account uses Google Sign-In, so it doesn't have a password to reset. Please log in with Google instead.</p>`,
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
        'Pulse.Jc - Reset your password',
        `<p>Click the link below to reset your Pulse.Jc password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
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

    return { message: 'Password has been reset successfully' };
  }

  /* ------ */

  private buildAuthResponse(user: User) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    return { accessToken, user: sanitizeUser(user) };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
