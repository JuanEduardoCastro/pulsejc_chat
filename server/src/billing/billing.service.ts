import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '@/prisma/prisma.service';
import { User } from '../../generated/prisma/client';

const PRO_STATUSES: Stripe.Subscription.Status[] = [
  'active',
  'trialing',
  'past_due',
];

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly priceId: string;
  private readonly clientUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.stripe = new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY'));
    this.webhookSecret = config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    this.priceId = config.getOrThrow<string>('STRIPE_PRICE_ID');
    this.clientUrl = config.getOrThrow<string>('CLIENT_URL');
  }

  async createCheckoutSession(user: User) {
    if (user.plan === 'PRO') {
      throw new ConflictException('Already subscribed');
    }
    const customerId = await this.getOrCreateCustomer(user);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: this.priceId, quantity: 1 }],
      locale: user.locale === 'es' ? 'es' : 'en',
      success_url: `${this.clientUrl}/chat?billing=success`,
      cancel_url: `${this.clientUrl}/chat?billing=cancel`,
    });

    if (!session.url)
      throw new BadRequestException('Failed to create checkout session');
    return { url: session.url };
  }

  async createPortalSession(user: User) {
    if (!user.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.clientUrl}/chat?billing=portal`,
    });
    return { url: session.url };
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }
  async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          await this.syncSubscription(subscriptionId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.syncSubscription(event.data.object.id);
        break;
      default:
        break;
    }
  }

  async deleteCustomer(user: User) {
    if (!user.stripeCustomerId) return;
    await this.stripe.customers.del(user.stripeCustomerId);
  }

  private async getOrCreateCustomer(user: User) {
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.stripe.customers.create(
      { email: user.email, metadata: { userId: user.id } },
      { idempotencyKey: `create-customer-${user.id}` }, // a double click won't create two customers
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }

  private async syncSubscription(subscriptionId: string) {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    const isPro = PRO_STATUSES.includes(subscription.status);
    const periodEnd = subscription.items.data[0]?.current_period_end;

    await this.prisma.user.updateMany({
      where: isPro
        ? { stripeCustomerId: customerId }
        : {
            stripeCustomerId: customerId,
            OR: [
              { stripeSubscriptionId: subscriptionId },
              { stripeSubscriptionId: null },
            ],
          },
      data: {
        plan: isPro ? 'PRO' : 'FREE',
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }
}
