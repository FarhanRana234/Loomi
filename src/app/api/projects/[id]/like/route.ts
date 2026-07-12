import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { verifyRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Authentication required to like" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const firebaseId = decoded.uid;
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
