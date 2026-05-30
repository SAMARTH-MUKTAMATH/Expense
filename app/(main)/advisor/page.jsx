import Link from "next/link";
import { getMyReports } from "@/actions/advisor";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateButton } from "./_components/generate-button";

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

export default async function AdvisorListPage() {
  const reports = await getMyReports();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Your reports</h2>
          <p className="text-sm text-gray-400">
            {reports.length === 0
              ? "No reports yet — generate your first one."
              : `${reports.length} report${reports.length === 1 ? "" : "s"} generated.`}
          </p>
        </div>
        <GenerateButton />
      </div>

      {reports.length === 0 ? (
        <Card className="bg-[#161616] border-white/10 border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center">
            <p className="text-white font-medium mb-1">
              No financial advice generated yet
            </p>
            <p className="text-sm text-gray-400 max-w-md">
              Click "Generate now" to produce your first AI-powered monthly
              report. It takes about 30 seconds and will arrive in your inbox
              as a PDF.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <Link key={r.id} href={`/advisor/${r.id}`}>
              <Card className="bg-[#161616] border-white/10 hover:border-[#89E900]/50 transition-colors h-full">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#89E900]">
                      AI Analysis
                    </p>
                    {r.emailSentAt ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 border border-blue-400/30 rounded px-1.5 py-0.5">
                        ✉ Emailed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                        Web only
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {formatMonthKey(r.monthKey)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Generated {formatDate(r.createdAt)}
                  </p>
                  {r.emailSentAt && (
                    <p className="text-xs text-blue-300 mt-0.5">
                      Sent to inbox {formatDate(r.emailSentAt)}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Health score</span>
                    <span className={`text-sm font-bold ${scoreColor(r.healthScore)}`}>
                      {r.healthScore ?? "—"}<span className="text-gray-500 font-normal"> / 100</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
