import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayKey } from "@/lib/boss";

function getPlayerName(user: {
  id: string;
  username: string | null;
  isGuest: boolean;
}) {
  if (!user.isGuest && user.username) {
    return `@${user.username}`;
  }

  return `Guest ${user.id.slice(0, 6)}`;
}

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") ?? "today";

  if (period === "today") {
    const today = getTodayKey();

    const spins = await prisma.spin.findMany({
      where: {
        date: today,
      },
      orderBy: [
        {
          damage: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isGuest: true,
          },
        },
      },
    });

    return NextResponse.json({
      period: "today",
      rows: spins.map((spin, index) => ({
        rank: index + 1,
        userId: spin.userId,
        playerName: getPlayerName(spin.user),
        symbols: spin.symbols.split(","),
        damage: spin.damage,
        createdAt: spin.createdAt,
      })),
    });
  }

  if (period === "all") {
    const grouped = await prisma.spin.groupBy({
      by: ["userId"],
      _sum: {
        damage: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          damage: "desc",
        },
      },
      take: 50,
    });

    const rows = await Promise.all(
      grouped.map(async (row, index) => {
        const user = await prisma.user.findUnique({
          where: {
            id: row.userId,
          },
          select: {
            id: true,
            username: true,
            isGuest: true,
          },
        });

        const bestSpin = await prisma.spin.findFirst({
          where: {
            userId: row.userId,
          },
          orderBy: [
            {
              damage: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        });

        return {
          rank: index + 1,
          userId: row.userId,
          playerName: user ? getPlayerName(user) : "Unknown player",
          symbols: bestSpin ? bestSpin.symbols.split(",") : [],
          damage: row._sum.damage ?? 0,
          attacks: row._count.id,
        };
      })
    );

    return NextResponse.json({
      period: "all",
      rows,
    });
  }

  return NextResponse.json(
    {
      error: "Invalid period",
    },
    {
      status: 400,
    }
  );
}