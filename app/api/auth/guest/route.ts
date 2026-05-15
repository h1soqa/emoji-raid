import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createGuestUser,
  createSessionToken,
  getCurrentUser,
  getLoggedOutCookieName,
  getSessionCookieName,
} from "@/lib/auth";

export async function POST() {
  const existingUser = await getCurrentUser();

  if (existingUser) {
    return NextResponse.json({
      user: existingUser,
    });
  }

  const cookieStore = await cookies();
  const isLoggedOut = cookieStore.get(getLoggedOutCookieName())?.value === "true";

  if (isLoggedOut) {
    return NextResponse.json(
      {
        user: null,
        error: "Login required",
      },
      { status: 401 }
    );
  }

  const user = await createGuestUser();
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

  response.cookies.delete(getLoggedOutCookieName());

  return response;
}