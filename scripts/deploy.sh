#!/usr/bin/env bash

set -euo pipefail

APP_NAME="pulsejc-api"        # pm2 process name — confirm with `pm2 ls`
WEB_ROOT="/var/www/pulsejc"
RELEASE="$(git rev-parse --short HEAD)"

echo "==> Deploying $RELEASE"
npm ci

echo "==> Server"
cd server
npx prisma generate
npm run build
npx prisma migrate deploy
SENTRY_RELEASE="$RELEASE" pm2 reload "$APP_NAME" --update-env
cd ..

echo "==> Client"
cd client
VITE_SENTRY_RELEASE="$RELEASE" npm run build
sudo rsync -a --delete dist/ "$WEB_ROOT"/
sudo chown -R www-data:www-data "$WEB_ROOT"
cd ..

echo "==> Health check"
for _ in {1..10}; do
  if curl -fsS http://localhost:3000/api > /dev/null; then
    echo "Deploy $RELEASE OK"
    exit 0
  fi
  sleep 3
done
echo "Health check failed"
pm2 logs "$APP_NAME" --lines 50 --nostream
exit 1
