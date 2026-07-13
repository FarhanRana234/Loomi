import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return cloudinary;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url) || url.includes("/video/");
}

export function signUrl(publicId: string, options: {
  resource_type?: string;
  format?: string;
  type?: string;
  expiresInSeconds?: number;
} = {}): string {
  const c = getCloudinary();
  return c.utils.url(publicId, {
    resource_type: options.resource_type || "video",
    format: options.format,
    sign_url: true,
    type: options.type || "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + (options.expiresInSeconds || 3600),
  });
}
