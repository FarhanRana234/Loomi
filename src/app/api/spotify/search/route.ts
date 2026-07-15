import { NextRequest, NextResponse } from "next/server";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Failed to get Spotify token");

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const token = await getSpotifyToken();

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=8&market=US`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Spotify API error" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const tracks = (data.tracks?.items || []).map(
      (track: {
        id: string;
        name: string;
        artists: { name: string }[];
        album: { name: string; images: { url: string }[] };
        preview_url: string | null;
        external_urls: { spotify: string };
      }) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        albumArt: track.album.images?.[0]?.url || "",
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
      })
    );

    return NextResponse.json({ success: true, data: tracks });
  } catch (error) {
    console.error("GET /api/spotify/search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search Spotify" },
      { status: 500 }
    );
  }
}
