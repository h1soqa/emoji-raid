import { NextResponse } from "next/server";
import {
  getLoggedOutCookieName,
  getSessionCookieName,
} from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
  });

  response.cookies.delete(getSessionCookieName());

  response.cookies.set(getLoggedOutCookieName(), "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}