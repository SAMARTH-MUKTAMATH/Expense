"use server";

import { BrevoClient } from "@getbrevo/brevo";
import { render } from "@react-email/render";

export async function sendEmail({ to, subject, react, attachments }) {
    if (!process.env.BREVO_API_KEY) {
        const error = new Error("BREVO_API_KEY is not set");
        console.error(error.message);
        return { success: false, error };
    }
    if (!process.env.BREVO_SENDER_EMAIL) {
        const error = new Error("BREVO_SENDER_EMAIL is not set");
        console.error(error.message);
        return { success: false, error };
    }

    try {
        const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
        const htmlContent = await render(react);

        const message = {
            sender: {
                name: process.env.BREVO_SENDER_NAME || "BudgetFLOW",
                email: process.env.BREVO_SENDER_EMAIL,
            },
            to: [{ email: to }],
            subject,
            htmlContent,
        };

        if (Array.isArray(attachments) && attachments.length > 0) {
            message.attachment = attachments.map((a) => ({
                name: a.filename,
                content: Buffer.isBuffer(a.content)
                    ? a.content.toString("base64")
                    : a.content,
            }));
        }

        const data = await client.transactionalEmails.sendTransacEmail(message);
        return { success: true, data };
    } catch (error) {
        console.error("Brevo send failed:", error?.message ?? error);
        return { success: false, error };
    }
}
