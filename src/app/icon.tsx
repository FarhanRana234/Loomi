import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";
export const alt = "Loomi";

export default function Icon() {
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
          borderRadius: "20%",
        }}
      >
        <span
          style={{
            fontSize: 280,
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
