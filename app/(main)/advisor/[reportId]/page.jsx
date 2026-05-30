import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReport } from "@/actions/advisor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatMonthKey(key) {
  const [y, m] = key.split("-");
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function formatDate(d) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColor(score) {
  if (score == null) return "text-gray-400";
  if (score >= 75) return "text-[#89E900]";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

export default async function AdvisorDetailPage({ params }) {
  const { reportId } = await params;
  let report;
  try {
    report = await getReport(reportId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/advisor"
          className="text-sm text-gray-400 hover:text-[#89E900]"
        >
          ← Back to all reports
        </Link>
        <a
          href={`/api/advisor/${report.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="gap-2 btn-primary">Download PDF</Button>
        </a>
      </div>

      <Card className="bg-[#161616] border-white/10">
        <CardContent className="pt-5 pb-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="mb-1">
              {report.emailSentAt ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 border border-blue-400/30 rounded px-1.5 py-0.5">
                  ✉ Emailed
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                  Web only
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {formatMonthKey(report.monthKey)}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Generated {formatDate(report.createdAt)}
            </p>
            {report.emailSentAt && (
              <p className="text-xs text-blue-300 mt-0.5">
                Sent to inbox {formatDate(report.emailSentAt)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Health score
            </p>
            <p className={`text-4xl font-extrabold ${scoreColor(report.healthScore)}`}>
              {report.healthScore ?? "—"}
              <span className="text-lg text-gray-400"> / 100</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0f0f0f] border-white/10">
        <CardContent className="py-8 px-6 md:px-10">
          <article className="advisor-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.contentMarkdown}
            </ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
