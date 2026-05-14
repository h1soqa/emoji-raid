import { prisma } from "@/lib/prisma";

const bosses = [
  { name: "Angry Tomato", emoji: "🍅", maxHp: 1000 },
  { name: "Cyber Ghost", emoji: "👻", maxHp: 1200 },
  { name: "Fire Pig", emoji: "🐷", maxHp: 1500 },
  { name: "Ice Dragon", emoji: "🐉", maxHp: 2000 },
];

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getOrCreateTodayBoss() {
  const date = getTodayKey();

  const existingBoss = await prisma.boss.findUnique({
    where: { date },
  });

  if (existingBoss) {
    return existingBoss;
  }

  const bossTemplate =
    bosses[Math.floor(Math.random() * bosses.length)];

  return prisma.boss.create({
    data: {
      date,
      name: bossTemplate.name,
      emoji: bossTemplate.emoji,
      maxHp: bossTemplate.maxHp,
      currentHp: bossTemplate.maxHp,
    },
  });
}