import { User } from '../../generated/prisma/client';

export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
