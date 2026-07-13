import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";
export const alt = "Loomi";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontFamily: "Arial, sans-serif",
            fontWeight: "bold",
            color: "white",
            lineHeight: 1,
          }}
        >
          L
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
