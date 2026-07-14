import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Comment from "@/models/Comment";
import { verifyRequest } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const comments = await Comment.find({ projectId })
      .populate("userId", "username avatarUrl firebaseId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ firebaseId: decoded.uid });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { projectId, text, parentId } = body;

    if (!projectId || !text?.trim()) {
      return NextResponse.json(
        { success: false, error: "projectId and text required" },
        { status: 400 }
      );
    }

    const comment = await Comment.create({
      projectId,
      userId: user._id,
      text: text.trim().slice(0, 1000),
      parentId: parentId || null,
    });

    const populated = await comment.populate("userId", "username avatarUrl firebaseId");

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
