import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";

export async function extractToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split("Bearer ")[1];
  }

  const cookieStore = await cookies();
  return cookieStore.get("__session")?.value || null;
}

export async function verifyRequest(request: NextRequest) {
  const token = await extractToken(request);
  if (!token) return null;
  try {
    return await getAdminAuth().verifySessionCookie(token);
  } catch {
    return null;
  }
}
