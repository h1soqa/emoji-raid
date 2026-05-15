import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "emoji_raid_session";
const LOGGED_OUT_COOKIE_NAME = "emoji_raid_logged_out";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getAuthSecret());
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = payload.userId;

    if (typeof userId !== "string") {
      return null;
    }

    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isGuest: true,
        createdAt: true,
      },
    });
  } catch {
    return null;
  }
}

export async function createGuestUser() {
  return prisma.user.create({
    data: {
      isGuest: true,
    },
    select: {
      id: true,
      username: true,
      isGuest: true,
      createdAt: true,
    },
  });
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getLoggedOutCookieName() {
  return LOGGED_OUT_COOKIE_NAME;
}