import { ImageResponse } from "next/og";

// Next 16 file convention: this route is auto-served at /icon as a 512×512
// PNG and the framework injects <link rel="icon"> automatically. We use
// ImageResponse so the icon is generated from the same brand DNA as the
// header — lime fill + dark HandCoins mark — instead of being a stale image.

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// HandCoins SVG path data from lucide. Rendered as a single inline <svg>
// inside the ImageResponse JSX (only HTML/CSS + <svg> elements are allowed).
const HAND_COINS = (
  <svg
    width="320"
    height="320"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#0a0a0a"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
    <path d="m2 16 6 6" />
    <circle cx="16" cy="9" r="2.9" />
    <circle cx="6" cy="5" r="3" />
  </svg>
);

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#89E900",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {HAND_COINS}
      </div>
    ),
    { ...size }
  );
}
