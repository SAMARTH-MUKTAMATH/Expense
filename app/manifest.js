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
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
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
