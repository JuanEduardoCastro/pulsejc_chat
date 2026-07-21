import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { sanitizeUser } from '@/users/users.util';
import { User } from '../../generated/prisma/browser';
import { LoginDto } from './dto/login.dto';
import { GoogleProfile } from './google.strategy';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
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

  private buildAuthResponse(user: User) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    return { accessToken, user: sanitizeUser(user) };
  }
}
