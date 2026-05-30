"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { inngest } from "@/lib/inngest/client";
import { revalidatePath } from "next/cache";

const RATE_LIMIT_HOURS = 24;

/**
 * Fire an Inngest event asking the advisor worker to generate a report for the
 * current user. Rate-limited to one report per user per 24h to keep AI costs
 * sane. deliveryMode controls whether the PDF is also emailed.
 *
 * @param {"web" | "email"} deliveryMode
 */
export async function requestAdvisorReport(deliveryMode = "web") {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  if (deliveryMode !== "web" && deliveryMode !== "email") {
    throw new Error("Invalid deliveryMode");
  }

  const cutoff = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000);
  const recent = await db.financialReport.findFirst({
    where: { userId: user.id, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return {
      success: false,
      rateLimited: true,
      message: "You've already generated a report in the last 24 hours.",
      nextAvailable: new Date(recent.createdAt.getTime() + RATE_LIMIT_HOURS * 60 * 60 * 1000).toISOString(),
    };
  }

  await inngest.send({
    name: "advisor.generate.request",
    data: { userId: user.id, source: "on-demand", deliveryMode },
  });

  revalidatePath("/advisor");
  return { success: true, deliveryMode };
}

export async function getMyReports() {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const reports = await db.financialReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      monthKey: true,
      healthScore: true,
      source: true,
      deliveryMode: true,
      emailSentAt: true,
      createdAt: true,
    },
  });
  return reports;
}

export async function getReport(reportId) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const report = await db.financialReport.findUnique({
    where: { id: reportId },
  });
  if (!report || report.userId !== user.id) {
    throw new Error("Report not found");
  }
  return report;
}
