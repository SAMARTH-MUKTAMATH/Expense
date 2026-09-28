import { generateIngestToken } from "@/actions/ingest-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_SHAPE = /^[A-Za-z0-9_-]{16,64}$/;

export async function GET(request) {
  const state = request.nextUrl.searchParams.get("state") ?? "";
  if (!STATE_SHAPE.test(state)) {
    return new Response("Open the BudgetFLOW app and tap Turn on auto tracking.", {
      status: 400,
    });
  }

  const { token } = await generateIngestToken();

  // server redirect, Chrome blocks script redirects to apps
  return new Response(null, {
    status: 302,
    headers: {
      Location: `paisa://connect?${new URLSearchParams({ token, state })}`,
      "Cache-Control": "no-store",
    },
  });
}
