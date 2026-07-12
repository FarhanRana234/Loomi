import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = await getAdminAuth().verifyIdToken(token);

    await connectToDatabase();
    const user = await User.findOne({ firebaseId: decoded.uid }).select("-__v");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }
}
