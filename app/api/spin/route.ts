import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodayBoss, getTodayKey } from "@/lib/boss";
import { calculateDamage, spinSlot } from "@/lib/slot";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const date = getTodayKey();
  const boss = await getOrCreateTodayBoss();

  const existingSpin = await prisma.spin.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date,
      },
    },
  });

  if (existingSpin) {
    return NextResponse.json(
      {
        error: "You have already played today",
        spin: existingSpin,
      },
      { status: 409 }
    );
  }

  const symbols = spinSlot();
  const damage = calculateDamage(symbols);

  const spin = await prisma.spin.create({
    data: {
      userId: user.id,
      bossId: boss.id,
      date,
      symbols: symbols.join(","),
      damage,
    },
  });

  const updatedBoss = await prisma.boss.update({
    where: { id: boss.id },
    data: {
      currentHp: Math.max(0, boss.currentHp - damage),
    },
  });

  return NextResponse.json({
    symbols,
    damage,
    spin,
    boss: updatedBoss,
  });
}