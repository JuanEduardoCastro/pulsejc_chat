import { User } from '../../generated/prisma/client';
import { isDemoEmail } from '@/common/demo';

type PrivateField =
  'passwordHash' | 'stripeCustomerId' | 'stripeSubscriptionId';
type BillingField =
  'plan' | 'subscriptionStatus' | 'currentPeriodEnd' | 'cancelAtPeriodEnd';

export function sanitizeUser(
  user: User,
): Omit<User, PrivateField | BillingField> {
  const {
    passwordHash: _passwordHash,
    stripeCustomerId: _stripeCustomerId,
    stripeSubscriptionId: _stripeSubscriptionId,
    plan: _plan,
    subscriptionStatus: _subscriptionStatus,
    currentPeriodEnd: _currentPeriodEnd,
    cancelAtPeriodEnd: _cancelAtPeriodEnd,
    ...safeUser
  } = user;
  return safeUser;
}

export function sanitizeSelf(user: User) {
  const {
    passwordHash: _passwordHash,
    stripeCustomerId: _stripeCustomerId,
    stripeSubscriptionId: _stripeSubscriptionId,
    ...self
  } = user;
  return { ...self, isDemo: isDemoEmail(user.email) };
}
