import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = _request.headers.get("authorization");
    let firebaseId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const decoded = await getAdminAuth().verifyIdToken(token);
        firebaseId = decoded.uid;
      } catch {
        // allow anonymous likes
      }
    }

    await connectToDatabase();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (!firebaseId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to like" },
        { status: 401 }
      );
    }

    const alreadyLiked = project.likes.includes(firebaseId);

    if (alreadyLiked) {
      project.likes = project.likes.filter((like: string) => like !== firebaseId);
    } else {
      project.likes.push(firebaseId);
    }

    await project.save();

    return NextResponse.json({
      success: true,
      data: {
        liked: !alreadyLiked,
        totalLikes: project.likes.length,
      },
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/like error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
