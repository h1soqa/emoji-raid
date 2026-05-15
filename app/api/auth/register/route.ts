import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionCookieName } from "@/lib/auth";

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function isValidPassword(password: string) {
  return password.length >= 6 && password.length <= 100;
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!isValidUsername(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-20 characters and contain only letters, numbers and underscore",
      },
      { status: 400 }
    );
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Username is already taken" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
    },
    select: {
      id: true,
      username: true,
    },
  });

  const token = await createSessionToken(user.id);

  const response = NextResponse.json({
    user,
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