import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f7f7f3",
        border: "2px solid #2859c5",
        color: "#171714",
        display: "flex",
        fontSize: 11,
        fontWeight: 700,
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      OR
    </div>,
    size,
  );
}
