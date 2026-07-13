import { NextResponse } from "next/server";

const SESSION_MAX_AGE = 60 * 60 * 24 * 14 * 1000; // 14 days in ms

export async function setSessionCookie(
  response: NextResponse,
  idToken: string
): Promise<NextResponse> {
  const { getAdminAuth } = await import("./firebase-admin");
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE,
  });
  response.cookies.set("__session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE / 1000,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete("__session");
  return response;
}
