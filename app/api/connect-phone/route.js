import { generateIngestToken } from "@/actions/ingest-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_SHAPE = /^[A-Za-z0-9_-]{16,64}$/;

function returnToAppPage(link) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Connecting BudgetFLOW</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #0a0a0a; color: #fff; font-family: system-ui, sans-serif; text-align: center; }
  p { color: rgba(255, 255, 255, 0.6); }
  a { display: inline-block; margin-top: 16px; padding: 14px 28px; border-radius: 12px; background: #89e900; color: #0a0a0a; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<main>
  <h1>Almost done</h1>
  <p>Taking you back to the BudgetFLOW app.</p>
  <a href="${link}">Back to the app</a>
</main>
<script>location.replace(${JSON.stringify(link)});</script>
</body>
</html>`;
}

export async function GET(request) {
  const state = request.nextUrl.searchParams.get("state") ?? "";
  if (!STATE_SHAPE.test(state)) {
    return new Response("Open the BudgetFLOW app on your phone and tap Start auto tracking.", {
      status: 400,
    });
  }

  const { token } = await generateIngestToken();
  const link = `paisa://connect?${new URLSearchParams({ token, state })}`;

  return new Response(returnToAppPage(link), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
