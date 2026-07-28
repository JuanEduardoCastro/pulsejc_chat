import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { I18nService } from 'nestjs-i18n';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;
  let prisma: {
    passwordResetToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  const baseUser = {
    id: 'user-1',
    email: 'jane@example.com',
    passwordHash: null as string | null,
    firstName: null,
    lastName: null,
    nickname: null,
    googleId: null,
    avatarURL: null,
    hasSeenWelcome: false,
    locale: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  beforeEach(async () => {
    prisma = {
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updatePassword: jest.fn(),
            findByGoogleId: jest.fn(),
            linkGoogleAccount: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-jwt') },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('http://localhost:5173'),
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: { send: jest.fn() } },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  describe('register', () => {
    it('throws ConflictException when the email is already in use', async () => {
      usersService.findByEmail.mockResolvedValue(baseUser);

      await expect(
        authService.register({ email: baseUser.email, password: 'Passw0rd' }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('hashes the password and returns an access token with a sanitized user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((data) =>
        Promise.resolve({ ...baseUser, ...data }),
      );

      const result = await authService.register({
        email: 'new@example.com',
        password: 'Passw0rd',
      });

      const [createArgs] = usersService.create.mock.calls[0];
      expect(createArgs.email).toBe('new@example.com');
      expect(createArgs.passwordHash).not.toBe('Passw0rd');
      await expect(
        bcrypt.compare('Passw0rd', createArgs.passwordHash as string),
      ).resolves.toBe(true);

      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: baseUser.id,
        email: 'new@example.com',
      });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for a Google-only account (no password set)', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...baseUser,
        passwordHash: null,
      });

      await expect(
        authService.login({ email: baseUser.email, password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass1', 10);
      usersService.findByEmail.mockResolvedValue({
        ...baseUser,
        passwordHash,
      });

      await expect(
        authService.login({ email: baseUser.email, password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns an access token when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass1', 10);
      usersService.findByEmail.mockResolvedValue({
        ...baseUser,
        passwordHash,
      });

      const result = await authService.login({
        email: baseUser.email,
        password: 'CorrectPass1',
      });

      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user.email).toBe(baseUser.email);
    });
  });

  describe('forgotPassword', () => {
    it('returns the generic message and sends nothing when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.forgotPassword({
        email: 'nobody@example.com',
      });

      expect(mailService.send).not.toHaveBeenCalled();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(result.message).toMatch(/if that email is registered/i);
    });

    it('sends the Google-account notice for Google-only accounts, without creating a token', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...baseUser,
        passwordHash: null,
      });

      const result = await authService.forgotPassword({
        email: baseUser.email,
      });

      expect(mailService.send).toHaveBeenCalledTimes(1);
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(result.message).toMatch(/if that email is registered/i);
    });

    it('creates a reset token and sends the reset email for a real account, with the same generic response', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...baseUser,
        passwordHash: 'existing-hash',
      });

      const result = await authService.forgotPassword({
        email: baseUser.email,
      });

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: baseUser.id },
      });
      expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
      expect(mailService.send).toHaveBeenCalledTimes(1);
      expect(result.message).toMatch(/if that email is registered/i);
    });

    it('hashes the password and returns an access token with a sanitized user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((data) =>
        Promise.resolve({ ...baseUser, ...data }),
      );

      const result = await authService.register({
        email: 'new@example.com',
        password: 'Passw0rd',
      });

      const [createArgs] = usersService.create.mock.calls[0];
      expect(createArgs.email).toBe('new@example.com');
      expect(createArgs.passwordHash).not.toBe('Passw0rd');
      await expect(
        bcrypt.compare('Passw0rd', createArgs.passwordHash as string),
      ).resolves.toBe(true);

      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: baseUser.id,
        email: 'new@example.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException when the token does not exist', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.resetPassword({ token: 'bad', newPassword: 'NewPass1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when the token has expired', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        userId: baseUser.id,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        authService.resetPassword({
          token: 'expired',
          newPassword: 'NewPass1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates the password and clears all reset tokens for a valid token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        userId: baseUser.id,
        expiresAt: new Date(Date.now() + 1000 * 60),
      });

      await authService.resetPassword({
        token: 'valid',
        newPassword: 'NewPass1',
      });

      const [, newHash] = usersService.updatePassword.mock.calls[0];
      await expect(bcrypt.compare('NewPass1', newHash)).resolves.toBe(true);
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: baseUser.id },
      });
    });
  });
});
