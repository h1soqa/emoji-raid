import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodayBoss, getTodayKey } from "@/lib/boss";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const date = getTodayKey();
  const boss = await getOrCreateTodayBoss();

  const spin = await prisma.spin.findUnique({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
  });

  return NextResponse.json({
    canSpin: !spin,
    spin,
    boss,
  });
}