import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const DEMO_PASSWORD = 'Demo1234';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function upsertDemoUser(
  email: string,
  firstName: string,
  lastName: string,
) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      firstName: firstName,
      lastName: lastName,
      nickname: firstName,
      hasSeenWelcome: true,
    },
  });
}

async function ensureAcceptedContact(userAId: string, userBId: string) {
  const existingContact = await prisma.contact.findFirst({
    where: {
      OR: [
        { userId: userAId, contactId: userBId },
        { userId: userBId, contactId: userAId },
      ],
    },
  });

  if (existingContact) {
    await prisma.contact.update({
      where: { id: existingContact.id },
      data: { status: 'ACCEPTED' },
    });
  } else {
    await prisma.contact.create({
      data: { userId: userAId, contactId: userBId, status: 'ACCEPTED' },
    });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { participants: { some: { userId: userAId } } },
        { participants: { some: { userId: userBId } } },
      ],
    },
  });

  if (!conversation) {
    await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: { create: [{ userId: userAId }, { userId: userBId }] },
      },
    });
  }
}

async function ensurePendingContact(senderId: string, recipientId: string) {
  const existingContact = await prisma.contact.findFirst({
    where: {
      OR: [
        { userId: senderId, contactId: recipientId },
        { userId: recipientId, contactId: senderId },
      ],
    },
  });

  if (!existingContact) {
    await prisma.contact.create({
      data: { userId: senderId, contactId: recipientId, status: 'PENDING' },
    });
  }
}

async function main() {
  const demo1 = await upsertDemoUser('demo1@example.com', 'Demo', 'One');
  const demo2 = await upsertDemoUser('demo2@example.com', 'Demo', 'Two');
  const demo3 = await upsertDemoUser('demo3@example.com', 'Demo', 'Three');

  await ensureAcceptedContact(demo1.id, demo2.id);
  await ensurePendingContact(demo3.id, demo1.id);

  console.log('Seed complete. Password for all demo accounts: Demo1234');
  console.log(
    'demo1@example.com — accepted contact: demo2, pending request from: demo3',
  );
  console.log('demo2@example.com — accepted contact: demo1');
  console.log('demo3@example.com — sent pending request to demo1');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
