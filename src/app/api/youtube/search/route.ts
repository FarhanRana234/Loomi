import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "YouTube API key not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&videoCategoryId=10&maxResults=8&key=${apiKey}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "YouTube API error" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const videos = (data.items || []).map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: { medium?: { url: string }; default?: { url: string } };
        };
      }) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
      })
    );

    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error("GET /api/youtube/search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search YouTube" },
      { status: 500 }
    );
  }
}
