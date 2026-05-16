import type { Boss } from "@/app/generated/prisma/client";

export function getTodayStart() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
}

export function getMinutesPassedToday() {
  const now = new Date();
  const todayStart = getTodayStart();

  return Math.floor((now.getTime() - todayStart.getTime()) / 1000 / 60);
}

export function calculateCastleHp(boss: Pick<Boss, "castleMaxHp" | "castleDamagePerMin">) {
  const damage = getMinutesPassedToday() * boss.castleDamagePerMin;

  return Math.max(0, boss.castleMaxHp - damage);
}

export function getComputedBossStatus(
  boss: Pick<
    Boss,
    "currentHp" | "castleMaxHp" | "castleDamagePerMin" | "status"
  >
) {
  const castleCurrentHp = calculateCastleHp(boss);

  if (boss.currentHp <= 0 && castleCurrentHp > 0) {
    return "won";
  }

  if (castleCurrentHp <= 0) {
    return "lost";
  }

  return boss.status;
}