import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

/**
 * Returns the local DB user for the currently signed-in Clerk user,
 * creating the row if it doesn't yet exist. Returns null if not signed in.
 * Throws on DB failure so the caller can decide how to handle it.
 */
export const checkUser = async () => {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    const name = [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || null;

    return db.user.upsert({
        where: { clerkUserId: clerkUser.id },
        update: {
            ...(name && { name }),
            ...(clerkUser.imageUrl && { imageUrl: clerkUser.imageUrl }),
            ...(email && { email }),
        },
        create: {
            clerkUserId: clerkUser.id,
            name,
            imageUrl: clerkUser.imageUrl,
            email,
        },
    });
};
