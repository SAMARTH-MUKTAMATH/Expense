import { ImageResponse } from "next/og";

// iOS home-screen icon. 180×180 is Apple's largest standard touch-icon size.
// Same lime-on-dark brand mark as /icon, scaled for the iOS tile.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const HAND_COINS = (
  <svg
    width="110"
    height="110"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#0a0a0a"
    strokeWidth="2.2"
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

export default function AppleIcon() {
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
