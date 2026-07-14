import { NextResponse } from "next/server";
import { upsertUserByEmail } from "@/lib/user-sync";

export async function POST(request: Request) {
  try {
    const { firebaseId, email, username, avatarUrl } = await request.json();

    if (!firebaseId || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await upsertUserByEmail({
      firebaseId,
      email,
      username,
      avatarUrl,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
