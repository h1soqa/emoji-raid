#!/usr/bin/env bash
set -e

cd ~/apps/emoji-raid

git fetch origin main
git reset --hard origin/main
git clean -fd -e .env

pnpm install --frozen-lockfile

pnpm prisma migrate deploy
pnpm prisma generate

pnpm build
pm2 reload emoji-raid