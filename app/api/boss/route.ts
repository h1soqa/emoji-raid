import { NextResponse } from "next/server";
import { getOrCreateTodayBoss } from "@/lib/boss";

export async function GET() {
  const boss = await getOrCreateTodayBoss();

  return NextResponse.json({
    boss,
  });
}