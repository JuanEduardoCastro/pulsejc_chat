import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from '@/users/users.service';
import { BillingService } from '@/billing/billing.service';
import { DEMO_EMAILS, DEMO_PASSWORD, DEMO_USERS } from '@/common/demo';

const SALT_ROUNDS = 12;
const MESSAGE_GAP_MS = 2 * 60 * 1000;

const DEMO_CONVERSATION: ['alex' | 'ana', string][] = [
  ['alex', 'Hey Ana! Did you get a chance to try the new app?'],
  ['ana', 'Yes! The AI assistant is surprisingly fast 😄'],
  ['alex', "Right? It streams the answer while it's typing."],
  ['ana', 'And the read receipts update instantly too.'],
  ['alex', 'Want to grab a coffee later and talk about the project?'],
  ['ana', 'Sure! 5 pm works for me ☕'],
];

@Injectable()
export class DemoService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly billingService: BillingService,
  ) {}

  onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'test') return;
    void this.reset();
  }

  @Cron('0 4 * * *') // every day at 04:00, server time (UTC on EC2)
  async scheduledReset() {
    await this.reset();
  }

  async reset() {
    try {
      const existing = await this.prisma.user.findMany({
        where: { email: { in: DEMO_EMAILS } },
      });
      for (const user of existing) {
        await this.billingService.deleteCustomer(user);
        await this.usersService.remove(user.id);
      }

      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
      const createUser = (
        profile: (typeof DEMO_USERS)[keyof typeof DEMO_USERS],
      ) =>
        this.prisma.user.create({
          data: { ...profile, passwordHash, hasSeenWelcome: true },
        });

      const alex = await createUser(DEMO_USERS.alex);
      const ana = await createUser(DEMO_USERS.ana);
      const sam = await createUser(DEMO_USERS.sam);

      await this.prisma.contact.create({
        data: { userId: alex.id, contactId: ana.id, status: 'ACCEPTED' },
      });
      const conversation = await this.prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: { create: [{ userId: alex.id }, { userId: ana.id }] },
        },
      });
      const start = Date.now() - DEMO_CONVERSATION.length * MESSAGE_GAP_MS;
      await this.prisma.message.createMany({
        data: DEMO_CONVERSATION.map(([sender, content], i) => ({
          conversationId: conversation.id,
          senderId: sender === 'alex' ? alex.id : ana.id,
          senderType: 'USER' as const,
          content,
          createdAt: new Date(start + i * MESSAGE_GAP_MS),
          readAt:
            i < DEMO_CONVERSATION.length - 1
              ? new Date(start + i * MESSAGE_GAP_MS + MESSAGE_GAP_MS / 2)
              : null,
        })),
      });

      const request = await this.prisma.contact.create({
        data: { userId: sam.id, contactId: alex.id, status: 'PENDING' },
      });
      await this.prisma.notification.create({
        data: {
          userId: alex.id,
          actorId: sam.id,
          type: 'CONTACT_REQUEST',
          contactId: request.id,
        },
      });

      this.logger.log('Demo accounts reset');
    } catch (error) {
      this.logger.error(
        `Demo accounts reset failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
