import { prisma } from "@/lib/prisma";

const bosses = [
  { 
    name: "Страж Древа", 
    emoji: "",
    imageUrl: "/images/straj_dreva.webp",
    maxHp: 1000,
    castleMaxHp: 1440,
    castleDamagePerMin: 1,
    castleImageUrl: "/castle.webp",
  },
  { 
    name: "Рыцарь Горнила", 
    emoji: "",
    imageUrl: "/images/ricar_gornila.webp",
    maxHp: 500,
    castleMaxHp: 1440,
    castleDamagePerMin: 1,
    castleImageUrl: "/castle.webp",
  },
  { 
    name: "Годрик Сторукий", 
    emoji: "",
    imageUrl: "/images/godrik.webp",
    maxHp: 1500,
    castleMaxHp: 1440,
    castleDamagePerMin: 1,
    castleImageUrl: "/castle.webp",
  },
  { 
    name: "Маления, Клинок Микеллы", 
    emoji: "",
    imageUrl: "/images/malenia.webp",
    maxHp: 1800,
    castleMaxHp: 1440,
    castleDamagePerMin: 2,
    castleImageUrl: "/castle.webp",
  },
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
      imageUrl: bossTemplate.imageUrl,
      maxHp: bossTemplate.maxHp,
      currentHp: bossTemplate.maxHp,
      castleMaxHp: bossTemplate.castleMaxHp,
      castleDamagePerMin: bossTemplate.castleDamagePerMin,
      castleImageUrl: bossTemplate.castleImageUrl,
    },
  });
}