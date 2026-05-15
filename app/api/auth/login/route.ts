import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const user = await prisma.user.findFirst({
    where: {
      username,
      isGuest: false,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const token = await createSessionToken(user.id);

  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      isGuest: user.isGuest,
    },
  });

  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}