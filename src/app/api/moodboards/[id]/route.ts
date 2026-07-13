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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const moodboard = await Moodboard.findOne({ _id: id, userId: uid });
    if (!moodboard) {
      return NextResponse.json(
        { success: false, error: "Moodboard not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, projectId, name, isPublic } = body;

    if (action === "add" && projectId) {
      if (!moodboard.projects.includes(projectId)) {
        moodboard.projects.push(projectId);
      }
    } else if (action === "remove" && projectId) {
      moodboard.projects = moodboard.projects.filter(
        (p: { toString(): string }) => p.toString() !== projectId
      );
    } else if (name !== undefined || isPublic !== undefined) {
      if (name !== undefined) moodboard.name = name;
      if (isPublic !== undefined) moodboard.isPublic = isPublic;
    }

    await moodboard.save();

    const populated = await Moodboard.findById(moodboard._id)
      .populate("projects", "title mediaUrl userId likes")
      .lean();

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    console.error("PATCH /api/moodboards/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update moodboard" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    await Moodboard.findOneAndDelete({ _id: id, userId: uid });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/moodboards/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete moodboard" },
      { status: 500 }
    );
  }
}
