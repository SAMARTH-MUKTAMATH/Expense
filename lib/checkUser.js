import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

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
