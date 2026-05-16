import { NextResponse } from "next/server";
import { getOrCreateTodayBoss } from "@/lib/boss";
import { calculateCastleHp, getComputedBossStatus } from "@/lib/castle";

export async function GET() {
  const boss = await getOrCreateTodayBoss();

  return NextResponse.json({
    boss: {
      ...boss,
      castleCurrentHp: calculateCastleHp(boss),
      computedStatus: getComputedBossStatus(boss),
    },
  });
}