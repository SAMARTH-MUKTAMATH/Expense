"use server";

import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";

const hash = (token) => createHash("sha256").update(token).digest("hex");

export async function getIngestStatus() {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { ingestTokenHash: true, ingestTokenSetAt: true, ingestLastSeenAt: true },
  });

  return {
    hasToken: Boolean(row?.ingestTokenHash),
    createdAt: row?.ingestTokenSetAt ? row.ingestTokenSetAt.toISOString() : null,
    lastSeenAt: row?.ingestLastSeenAt ? row.ingestLastSeenAt.toISOString() : null,
  };
}

export async function generateIngestToken() {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const token = randomBytes(32).toString("hex");

  await db.user.update({
    where: { id: user.id },
    data: {
      ingestTokenHash: hash(token),
      ingestTokenSetAt: new Date(),
      ingestLastSeenAt: null,
    },
  });

  revalidatePath("/settings");
  return { token };
}

export async function revokeIngestToken() {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  await db.user.update({
    where: { id: user.id },
    data: { ingestTokenHash: null, ingestTokenSetAt: null, ingestLastSeenAt: null },
  });

  revalidatePath("/settings");
  return { success: true };
}
