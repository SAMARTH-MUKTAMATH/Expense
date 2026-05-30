"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkUser } from "@/lib/checkUser";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";

const serializeAmount = (obj) => ({
    ...obj,
    amount: typeof obj.amount?.toNumber === "function" ? obj.amount.toNumber() : obj.amount,
});

const serializeGroup = (group) => ({
    ...group,
    expenses: group.expenses?.map((e) => ({
        ...serializeAmount(e),
        shares: e.shares?.map(serializeAmount) ?? [],
    })),
});

// ---------- CREATE ----------
export async function createGroup({ name, description, members }) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    if (!name?.trim()) throw new Error("Group name is required");
    if (!Array.isArray(members) || members.length === 0) {
        throw new Error("Add at least one member");
    }

    const cleaned = members
        .map((m) => ({ name: m.name?.trim(), email: m.email?.trim().toLowerCase() }))
        .filter((m) => m.name && m.email);

    if (cleaned.length === 0) throw new Error("Add at least one valid member");

    const group = await db.group.create({
        data: {
            name: name.trim(),
            description: description?.trim() || null,
            createdById: user.id,
            members: { create: cleaned },
        },
        include: { members: true },
    });

    revalidatePath("/groups");
    return { success: true, data: group };
}

// ---------- READ ----------
export async function getUserGroups() {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const groups = await db.group.findMany({
        where: { createdById: user.id },
        include: {
            _count: { select: { members: true, expenses: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    return groups;
}

export async function getGroup(id) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const group = await db.group.findFirst({
        where: { id, createdById: user.id },
        include: {
            members: { orderBy: { createdAt: "asc" } },
            expenses: {
                orderBy: { createdAt: "desc" },
                include: {
                    shares: { include: { member: true } },
                },
            },
        },
    });

    if (!group) return null;
    return serializeGroup(group);
}

// ---------- MEMBERS ----------
export async function addGroupMember(groupId, { name, email }) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const group = await db.group.findFirst({
        where: { id: groupId, createdById: user.id },
    });
    if (!group) throw new Error("Group not found");

    if (!name?.trim() || !email?.trim()) {
        throw new Error("Name and email are required");
    }

    const member = await db.groupMember.create({
        data: {
            groupId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
        },
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true, data: member };
}

export async function removeGroupMember(memberId) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const member = await db.groupMember.findUnique({
        where: { id: memberId },
        include: {
            group: true,
            shares: { where: { settled: false } },
        },
    });

    if (!member || member.group.createdById !== user.id) {
        throw new Error("Member not found");
    }

    if (member.shares.length > 0) {
        throw new Error(
            "This member has unsettled shares. Settle them first before removing."
        );
    }

    await db.groupMember.delete({ where: { id: memberId } });
    revalidatePath(`/groups/${member.groupId}`);
    return { success: true };
}

// ---------- EXPENSES ----------
export async function addExpense({
    groupId,
    description,
    amount,
    paidByName,
    splitWith,
}) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const group = await db.group.findFirst({
        where: { id: groupId, createdById: user.id },
        include: { members: true },
    });
    if (!group) throw new Error("Group not found");

    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0) throw new Error("Enter a valid amount");
    if (!description?.trim()) throw new Error("Description is required");
    if (!paidByName?.trim()) throw new Error("Who paid?");

    // Resolve who to split with — default = all members
    const memberIds =
        Array.isArray(splitWith) && splitWith.length > 0
            ? splitWith.filter((id) => group.members.some((m) => m.id === id))
            : group.members.map((m) => m.id);

    if (memberIds.length === 0) {
        throw new Error("No members to split with");
    }

    // Equal split with rounding remainder absorbed by the last share
    const perShare = Math.floor((total / memberIds.length) * 100) / 100;
    const shares = memberIds.map((memberId, i) => ({
        memberId,
        amount:
            i === memberIds.length - 1
                ? Number((total - perShare * (memberIds.length - 1)).toFixed(2))
                : perShare,
    }));

    const expense = await db.$transaction(async (tx) => {
        const created = await tx.groupExpense.create({
            data: {
                groupId,
                description: description.trim(),
                amount: total,
                paidByName: paidByName.trim(),
                shares: { create: shares },
            },
            include: {
                shares: { include: { member: true } },
            },
        });
        await tx.group.update({
            where: { id: groupId },
            data: { updatedAt: new Date() },
        });
        return created;
    });

    revalidatePath(`/groups/${groupId}`);
    return {
        success: true,
        data: {
            ...serializeAmount(expense),
            shares: expense.shares.map(serializeAmount),
        },
    };
}

export async function settleShare(shareId) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const share = await db.expenseShare.findUnique({
        where: { id: shareId },
        include: { expense: { include: { group: true } } },
    });
    if (!share || share.expense.group.createdById !== user.id) {
        throw new Error("Share not found");
    }

    const updated = await db.expenseShare.update({
        where: { id: shareId },
        data: { settled: true, settledAt: new Date() },
    });

    revalidatePath(`/groups/${share.expense.groupId}`);
    return { success: true, data: serializeAmount(updated) };
}

export async function unsettleShare(shareId) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const share = await db.expenseShare.findUnique({
        where: { id: shareId },
        include: { expense: { include: { group: true } } },
    });
    if (!share || share.expense.group.createdById !== user.id) {
        throw new Error("Share not found");
    }

    const updated = await db.expenseShare.update({
        where: { id: shareId },
        data: { settled: false, settledAt: null },
    });

    revalidatePath(`/groups/${share.expense.groupId}`);
    return { success: true, data: serializeAmount(updated) };
}

// ---------- NOTIFY (download path; email later) ----------
export async function getNotifyPayload(shareId) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const share = await db.expenseShare.findUnique({
        where: { id: shareId },
        include: {
            member: true,
            expense: { include: { group: true } },
        },
    });

    if (!share || share.expense.group.createdById !== user.id) {
        throw new Error("Share not found");
    }

    await db.expenseShare.update({
        where: { id: shareId },
        data: { notifiedAt: new Date() },
    });

    revalidatePath(`/groups/${share.expense.groupId}`);

    return {
        success: true,
        data: {
            group: { id: share.expense.group.id, name: share.expense.group.name },
            expense: {
                id: share.expense.id,
                description: share.expense.description,
                amount: share.expense.amount.toNumber(),
                paidByName: share.expense.paidByName,
                createdAt: share.expense.createdAt,
            },
            member: { id: share.member.id, name: share.member.name, email: share.member.email },
            share: { id: share.id, amount: share.amount.toNumber() },
        },
    };
}

// ---------- NOTIFY BY EMAIL (Brevo) ----------
const NOTIFY_THROTTLE_MS = 5 * 60 * 1000; // one email per share per 5 minutes

export async function notifyMemberByEmail(shareId) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const share = await db.expenseShare.findUnique({
        where: { id: shareId },
        include: {
            member: true,
            expense: { include: { group: true } },
        },
    });

    if (!share || share.expense.group.createdById !== user.id) {
        throw new Error("Share not found");
    }

    if (share.settled) {
        throw new Error("This share is already settled.");
    }

    if (
        share.notifiedAt &&
        Date.now() - new Date(share.notifiedAt).getTime() < NOTIFY_THROTTLE_MS
    ) {
        throw new Error(
            "Reminder was already sent recently. Please wait a few minutes before retrying."
        );
    }

    const groupName = share.expense.group.name;
    const description = share.expense.description;
    const amount = share.amount.toNumber();
    const totalExpense = share.expense.amount.toNumber();
    const paidByName = share.expense.paidByName;

    const result = await sendEmail({
        to: share.member.email,
        subject: `Reminder: ${formatINRSubject(amount)} due for "${description}" in ${groupName}`,
        react: EmailTemplate({
            userName: share.member.name,
            type: "settle-reminder",
            data: {
                amount,
                description,
                groupName,
                paidByName,
                totalExpense,
                senderName: user.name || user.email,
            },
        }),
    });

    if (!result?.success) {
        const message = result?.error?.message || "Email failed to send.";
        throw new Error(message);
    }

    await db.expenseShare.update({
        where: { id: shareId },
        data: { notifiedAt: new Date() },
    });

    revalidatePath(`/groups/${share.expense.groupId}`);

    return {
        success: true,
        data: {
            memberName: share.member.name,
            memberEmail: share.member.email,
            amount,
        },
    };
}

function formatINRSubject(n) {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return `₹${Number(n).toFixed(2)}`;
    }
}

// ---------- DELETE GROUP ----------
export async function deleteGroup(groupId) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const group = await db.group.findFirst({
        where: { id: groupId, createdById: user.id },
    });
    if (!group) throw new Error("Group not found");

    await db.group.delete({ where: { id: groupId } });
    revalidatePath("/groups");
    return { success: true };
}
