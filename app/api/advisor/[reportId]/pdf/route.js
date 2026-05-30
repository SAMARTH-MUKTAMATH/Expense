import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { renderAdvisorPdf } from "@/lib/advisor/renderPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { reportId } = await params;

  const user = await checkUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const report = await db.financialReport.findUnique({
    where: { id: reportId },
  });
  if (!report || report.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const pdf = await renderAdvisorPdf(report.contentMarkdown, {
    monthKey: report.monthKey,
    userName: user.name || "",
  });

  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BudgetFLOW-${report.monthKey}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
