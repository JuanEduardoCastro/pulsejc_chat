export const DEMO_PASSWORD = 'Demo1234';

export const DEMO_USERS = {
  alex: {
    email: 'demo1@example.com',
    firstName: 'Alex',
    lastName: 'Rivera',
    nickname: 'Alex',
  },
  ana: {
    email: 'demo2@example.com',
    firstName: 'Ana',
    lastName: 'García',
    nickname: 'Ana',
  },
  sam: {
    email: 'demo3@example.com',
    firstName: 'Sam',
    lastName: 'Lee',
    nickname: 'Sam',
  },
} as const;

export const DEMO_EMAILS: string[] = Object.values(DEMO_USERS).map(
  (u) => u.email,
);

export const DEMO_READ_ONLY_MESSAGE =
  'This action is disabled on the shared demo accounts';

export const DEMO_AI_MESSAGE_LIMIT = 30;

export function isDemoEmail(email: string) {
  return DEMO_EMAILS.includes(email.toLowerCase());
}
