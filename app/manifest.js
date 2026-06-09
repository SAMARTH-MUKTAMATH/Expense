/**
 * Next 16 file-based PWA manifest. Auto-served at /manifest.webmanifest
 * and the framework injects the <link rel="manifest"> tag for us.
 *
 * Updating any field here triggers a re-issue at request time — no rebuild
 * required.
 */
export default function manifest() {
  return {
    name: "BudgetFLOW",
    short_name: "BudgetFLOW",
    description:
      "Your AI-powered finance companion. Track every rupee, smarter.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Background must match the icon's outer color so the Android splash
    // doesn't show a jarring frame around the lime square.
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      // Same dynamic icon source for both — Android/Chrome will downscale
      // for the smaller bucket. This dodges having a third icon route and
      // keeps the brand mark in one place.
      {
        src: "/icon",
        sizes: "192x192 512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    categories: ["finance", "productivity", "lifestyle"],
  };
}
