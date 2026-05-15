import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodayBoss, getTodayKey } from "@/lib/boss";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  const boss = await getOrCreateTodayBoss();

  if (!user) {
    return NextResponse.json({
      user: null,
      canSpin: false,
      spin: null,
      boss,
    });
  }

  const date = getTodayKey();

  const spin = await prisma.spin.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date,
      },
    },
  });

  return NextResponse.json({
    user,
    canSpin: !spin,
    spin,
    boss,
  });
}