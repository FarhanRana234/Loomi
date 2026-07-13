import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { verifyRequest } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const admin = await User.findOne({ firebaseId: decoded.uid });
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const total = await Project.countDocuments(query);
    const items = await Project.find(query)
      .populate("userId", "username avatarUrl email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/admin/projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
