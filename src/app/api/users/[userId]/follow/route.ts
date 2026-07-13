import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Follow from "@/models/Follow";
import User from "@/models/User";
import { verifyRequest } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeanUser = any;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const follow = await Follow.findOne({
      followerId: decoded.uid,
      followingId: userId,
    }).lean();

    const targetUser = (await User.findOne({ firebaseId: userId })
      .select("followersCount followingCount")
      .lean()) as LeanUser;

    return NextResponse.json({
      success: true,
      data: {
        isFollowing: !!follow,
        followersCount: targetUser?.followersCount || 0,
        followingCount: targetUser?.followingCount || 0,
      },
    });
  } catch (error) {
    console.error("GET /api/users/[userId]/follow error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (decoded.uid === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await Follow.findOne({
      followerId: decoded.uid,
      followingId: userId,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Already following" },
        { status: 409 }
      );
    }

    await Follow.create({
      followerId: decoded.uid,
      followingId: userId,
    });

    await Promise.all([
      User.findOneAndUpdate(
        { firebaseId: decoded.uid },
        { $inc: { followingCount: 1 } }
      ),
      User.findOneAndUpdate(
        { firebaseId: userId },
        { $inc: { followersCount: 1 } }
      ),
    ]);

    const targetUser = (await User.findOne({ firebaseId: userId })
      .select("followersCount")
      .lean()) as LeanUser;

    return NextResponse.json({
      success: true,
      data: {
        isFollowing: true,
        followersCount: targetUser?.followersCount || 0,
      },
    });
  } catch (error) {
    console.error("POST /api/users/[userId]/follow error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const deleted = await Follow.findOneAndDelete({
      followerId: decoded.uid,
      followingId: userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Not following this user" },
        { status: 404 }
      );
    }

    await Promise.all([
      User.findOneAndUpdate(
        { firebaseId: decoded.uid },
        { $inc: { followingCount: -1 } }
      ),
      User.findOneAndUpdate(
        { firebaseId: userId },
        { $inc: { followersCount: -1 } }
      ),
    ]);

    const targetUser = (await User.findOne({ firebaseId: userId })
      .select("followersCount")
      .lean()) as LeanUser;

    return NextResponse.json({
      success: true,
      data: {
        isFollowing: false,
        followersCount: targetUser?.followersCount || 0,
      },
    });
  } catch (error) {
    console.error("DELETE /api/users/[userId]/follow error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
