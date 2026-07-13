import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Moodboard from "@/models/Moodboard";
import { getAdminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { isVideoUrl, getThumbnailUrl } from "@/lib/cloudinary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeanMoodboard = any;

function enrichMoodboardProjects(moodboard: LeanMoodboard): LeanMoodboard {
  const projects = moodboard.projects || [];
  moodboard.projects = projects.map((p: Record<string, unknown>) => {
    if (p.cloudinaryPublicId && isVideoUrl(p.mediaUrl as string)) {
      return {
        ...p,
        thumbnailUrl: getThumbnailUrl(
          p.cloudinaryPublicId as string,
          !!p.protected
        ),
      };
    }
    return p;
  });
  return moodboard;
}

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

const POPULATE_FIELDS = "title mediaUrl cloudinaryPublicId protected userId likes";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const publicOnly = searchParams.get("publicOnly") === "true";
    const projectId = searchParams.get("projectId");

    await connectToDatabase();

    if (userId) {
      const query: Record<string, unknown> = { userId };
      if (publicOnly) query.visibility = "public";
      if (projectId) query.projects = projectId;

      const moodboards = await Moodboard.find(query)
        .populate("projects", POPULATE_FIELDS)
        .sort({ updatedAt: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: moodboards.map(enrichMoodboardProjects),
      });
    }

    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const query: Record<string, unknown> = { userId: uid };
    if (projectId) query.projects = projectId;

    const moodboards = await Moodboard.find(query)
      .populate("projects", POPULATE_FIELDS)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: moodboards.map(enrichMoodboardProjects),
    });
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
    const { name, visibility } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name required" },
        { status: 400 }
      );
    }

    const moodboard = await Moodboard.create({
      name,
      userId: uid,
      visibility: visibility === "private" ? "private" : "public",
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
