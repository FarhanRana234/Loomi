import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Follow from "@/models/Follow";
import User from "@/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const [followDocs, total] = await Promise.all([
      Follow.find({ followerId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ followerId: userId }),
    ]);

    if (followDocs.length === 0) {
      return NextResponse.json({
        success: true,
        data: { users: [], total, page, totalPages: 0 },
      });
    }

    const followingIds = followDocs.map((f) => f.followingId);

    const users = await User.find({ firebaseId: { $in: followingIds } })
      .select("firebaseId username avatarUrl followersCount followingCount")
      .lean();

    const userMap = new Map(users.map((u) => [u.firebaseId, u]));
    const orderedUsers = followingIds
      .map((id) => userMap.get(id))
      .filter(Boolean)
      .map((u) => ({
        _id: String(u!._id),
        firebaseId: u!.firebaseId,
        username: u!.username,
        avatarUrl: u!.avatarUrl || "",
        followersCount: u!.followersCount || 0,
        followingCount: u!.followingCount || 0,
      }));

    return NextResponse.json({
      success: true,
      data: {
        users: orderedUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/users/[userId]/following error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
