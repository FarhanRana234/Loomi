import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Moodboard from "@/models/Moodboard";
import User from "@/models/User";
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
    const user = await User.findOne({ firebaseId: uid });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    const query: Record<string, unknown> = { userId: user._id };
    if (projectId) query.projectIds = projectId;

    const moodboards = await Moodboard.find(query)
      .populate("projectIds", "title mediaUrl userId likes")
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
    const user = await User.findOne({ firebaseId: uid });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name required" },
        { status: 400 }
      );
    }

    const moodboard = await Moodboard.create({
      name,
      description: description || "",
      userId: user._id,
      isPublic: !!isPublic,
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
