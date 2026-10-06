import { Test, TestingModule } from '@nestjs/testing';
import { AiUsageService } from './ai-usage.service';
import { PrismaService } from '../prisma/prisma.service';

const NOW = new Date('2026-10-03T12:00:00Z').getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

describe('AiUsageService', () => {
  let aiUsageService: AiUsageService;
  let prisma: {
    user: { findUniqueOrThrow: jest.Mock };
    message: { count: jest.Mock; findFirst: jest.Mock };
  };

  beforeEach(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    prisma = {
      user: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ plan: 'FREE', email: 'jane@example.com' }),
      },
      message: { count: jest.fn(), findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiUsageService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    aiUsageService = module.get(AiUsageService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('counts only user messages in AI conversations from the last 24h', async () => {
    prisma.message.count.mockResolvedValue(0);

    await aiUsageService.getUsage('user-1');

    expect(prisma.message.count).toHaveBeenCalledWith({
      where: {
        senderId: 'user-1',
        senderType: 'USER',
        conversation: { type: 'AI' },
        createdAt: { gte: new Date(NOW - DAY_MS) },
      },
    });
  });

  it('returns no reset time while under the FREE limit', async () => {
    prisma.message.count.mockResolvedValue(3);

    const usage = await aiUsageService.getUsage('user-1');

    expect(usage).toEqual({ plan: 'FREE', used: 3, limit: 10, resetsAt: null });
    expect(prisma.message.findFirst).not.toHaveBeenCalled();
  });

  it('uses the PRO limit for PRO users', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      plan: 'PRO',
      email: 'jane@example.com',
    });
    prisma.message.count.mockResolvedValue(50);

    const usage = await aiUsageService.getUsage('user-1');
    expect(usage).toEqual({
      plan: 'PRO',
      used: 50,
      limit: 300,
      resetsAt: null,
    });
  });

  it('resets 24h after the oldest message in the window when at the limit', async () => {
    const oldest = new Date(NOW - 5 * 60 * 60 * 1000);
    prisma.message.count.mockResolvedValue(10);
    prisma.message.findFirst.mockResolvedValue({ createdAt: oldest });

    const usage = await aiUsageService.getUsage('user-1');

    expect(prisma.message.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'asc' }, skip: 0 }),
    );
    expect(usage.resetsAt).toEqual(new Date(oldest.getTime() + DAY_MS));
  });

  it('skips the overflow when over the limit (e.g. after a PRO downgrade)', async () => {
    const blocking = new Date(NOW - 60 * 60 * 1000);
    prisma.message.count.mockResolvedValue(12);
    prisma.message.findFirst.mockResolvedValue({ createdAt: blocking });

    const usage = await aiUsageService.getUsage('user-1');

    expect(prisma.message.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 2 }),
    );
    expect(usage).toEqual({
      plan: 'FREE',
      used: 12,
      limit: 10,
      resetsAt: new Date(blocking.getTime() + DAY_MS),
    });
  });
});
