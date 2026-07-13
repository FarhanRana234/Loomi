import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Moodboard from "@/models/Moodboard";
import { getAdminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

async function getAuthUid(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    const query: Record<string, unknown> = { userId: uid };
    if (projectId) query.projects = projectId;

    const moodboards = await Moodboard.find(query)
      .populate("projects", "title mediaUrl userId likes")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: moodboards });
  } catch (error) {
    console.error("GET /api/moodboards error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch moodboards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { name, isPublic } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name required" },
        { status: 400 }
      );
    }

    const moodboard = await Moodboard.create({
      name,
      userId: uid,
      isPublic: isPublic !== undefined ? !!isPublic : true,
    });

    return NextResponse.json({ success: true, data: moodboard }, { status: 201 });
  } catch (error) {
    console.error("POST /api/moodboards error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create moodboard" },
      { status: 500 }
    );
  }
}
