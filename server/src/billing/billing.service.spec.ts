import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '../../generated/prisma/client';

const mockStripe = {
  customers: { create: jest.fn(), del: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  subscriptions: { retrieve: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
};

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockStripe),
}));

const CONFIG: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_123',
  STRIPE_PRICE_ID: 'price_123',
  CLIENT_URL: 'http://localhost:5173',
};

const PERIOD_END = 1767225600; // 2026-01-01T00:00:00Z

describe('BillingService', () => {
  let billingService: BillingService;
  let prisma: { user: { update: jest.Mock; updateMany: jest.Mock } };

  const baseUser: User = {
    id: 'user-1',
    email: 'jane@example.com',
    passwordHash: null,
    firstName: null,
    lastName: null,
    nickname: null,
    googleId: null,
    avatarURL: null,
    hasSeenWelcome: false,
    locale: 'en',
    plan: 'FREE',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const subscription = (overrides: Record<string, unknown> = {}) => ({
    id: 'sub_1',
    customer: 'cus_1',
    status: 'active',
    cancel_at_period_end: false,
    items: { data: [{ current_period_end: PERIOD_END }] },
    ...overrides,
  });

  const event = (type: string, object: Record<string, unknown>) =>
    ({ type, data: { object } }) as unknown as Stripe.Event;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = { user: { update: jest.fn(), updateMany: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn((key: string) => CONFIG[key]) },
        },
      ],
    }).compile();

    billingService = module.get(BillingService);
  });

  describe('createCheckoutSession', () => {
    it('throws ConflictException when the user is already PRO', async () => {
      await expect(
        billingService.createCheckoutSession({ ...baseUser, plan: 'PRO' }),
      ).rejects.toThrow(ConflictException);
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
    });

    it('reuses the existing Stripe customer', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/s/1',
      });

      const result = await billingService.createCheckoutSession({
        ...baseUser,
        stripeCustomerId: 'cus_existing',
        locale: 'es',
      });

      expect(result).toEqual({ url: 'https://checkout.stripe.com/s/1' });
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer: 'cus_existing',
          client_reference_id: 'user-1',
          line_items: [{ price: 'price_123', quantity: 1 }],
          locale: 'es',
          success_url: 'http://localhost:5173/chat?billing=success',
          cancel_url: 'http://localhost:5173/chat?billing=cancel',
        }),
      );
    });

    it('creates and stores a Stripe customer when the user has none', async () => {
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/s/2',
      });

      await billingService.createCheckoutSession(baseUser);

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        { email: 'jane@example.com', metadata: { userId: 'user-1' } },
        { idempotencyKey: 'create-customer-user-1' },
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { stripeCustomerId: 'cus_new' },
      });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_new', locale: 'en' }),
      );
    });

    it('throws BadRequestException when Stripe returns no URL', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: null });

      await expect(
        billingService.createCheckoutSession({
          ...baseUser,
          stripeCustomerId: 'cus_1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPortalSession', () => {
    it('throws BadRequestException when the user has no Stripe customer', async () => {
      await expect(
        billingService.createPortalSession(baseUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns the portal URL', async () => {
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/p/1',
      });

      const result = await billingService.createPortalSession({
        ...baseUser,
        stripeCustomerId: 'cus_1',
      });

      expect(result).toEqual({ url: 'https://billing.stripe.com/p/1' });
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_1',
        return_url: 'http://localhost:5173/chat?billing=portal',
      });
    });
  });

  describe('constructEvent', () => {
    it('verifies the signature with the webhook secret', () => {
      const body = Buffer.from('{}');
      mockStripe.webhooks.constructEvent.mockReturnValue({ id: 'evt_1' });

      expect(billingService.constructEvent(body, 'sig')).toEqual({
        id: 'evt_1',
      });
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        body,
        'sig',
        'whsec_123',
      );
    });
  });

  describe('handleEvent', () => {
    it('upgrades to PRO on checkout.session.completed', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription());

      await billingService.handleEvent(
        event('checkout.session.completed', {
          mode: 'subscription',
          subscription: 'sub_1',
        }),
      );

      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_1');
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_1' },
        data: {
          plan: 'PRO',
          stripeSubscriptionId: 'sub_1',
          subscriptionStatus: 'active',
          currentPeriodEnd: new Date(PERIOD_END * 1000),
          cancelAtPeriodEnd: false,
        },
      });
    });

    it('accepts an expanded subscription object on checkout', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(
        subscription({ customer: { id: 'cus_1' } }),
      );

      await billingService.handleEvent(
        event('checkout.session.completed', {
          mode: 'subscription',
          subscription: { id: 'sub_1' },
        }),
      );

      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_1');
      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { stripeCustomerId: 'cus_1' } }),
      );
    });

    it('ignores non-subscription checkouts', async () => {
      await billingService.handleEvent(
        event('checkout.session.completed', {
          mode: 'payment',
          subscription: null,
        }),
      );

      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it.each(['trialing', 'past_due'])(
      'keeps PRO while the subscription is %s',
      async (status) => {
        mockStripe.subscriptions.retrieve.mockResolvedValue(
          subscription({ status }),
        );

        await billingService.handleEvent(
          event('customer.subscription.updated', { id: 'sub_1' }),
        );

        expect(prisma.user.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ plan: 'PRO' }),
          }),
        );
      },
    );

    it('records cancel_at_period_end without downgrading', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(
        subscription({ cancel_at_period_end: true }),
      );

      await billingService.handleEvent(
        event('customer.subscription.updated', { id: 'sub_1' }),
      );

      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plan: 'PRO',
            cancelAtPeriodEnd: true,
          }),
        }),
      );
    });

    it('downgrades to FREE only for the matching subscription when deleted', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(
        subscription({ status: 'canceled', items: { data: [] } }),
      );

      await billingService.handleEvent(
        event('customer.subscription.deleted', { id: 'sub_1' }),
      );

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          stripeCustomerId: 'cus_1',
          OR: [
            { stripeSubscriptionId: 'sub_1' },
            { stripeSubscriptionId: null },
          ],
        },
        data: {
          plan: 'FREE',
          stripeSubscriptionId: 'sub_1',
          subscriptionStatus: 'canceled',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      });
    });

    it('ignores unrelated events', async () => {
      await billingService.handleEvent(event('invoice.paid', { id: 'in_1' }));

      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteCustomer', () => {
    it('does nothing when the user has no Stripe customer', async () => {
      await billingService.deleteCustomer(baseUser);
      expect(mockStripe.customers.del).not.toHaveBeenCalled();
    });

    it('deletes the Stripe customer', async () => {
      await billingService.deleteCustomer({
        ...baseUser,
        stripeCustomerId: 'cus_1',
      });
      expect(mockStripe.customers.del).toHaveBeenCalledWith('cus_1');
    });
  });
});
