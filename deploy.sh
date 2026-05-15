#!/usr/bin/env bash
set -e

cd ~/apps/emoji-raid

git fetch origin main
git reset --hard origin/main
git clean -fd -e .env -e deploy.sh

pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy
pnpm build
pm2 reload emoji-raid