import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

export default function globalSetup() {
  config({ path: resolve(__dirname, '../.env.test'), override: true });

  execSync('npx prisma migrate reset --force', {
    cwd: resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
}
