import { NextResponse } from "next/server";

const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set("__session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete("__session");
  return response;
}
