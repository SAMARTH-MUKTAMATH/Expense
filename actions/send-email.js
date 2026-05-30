"use server";

import { BrevoClient } from "@getbrevo/brevo";
import { render } from "@react-email/render";

/**
 * Send a transactional email via Brevo.
 *
 * Required env vars:
 *   BREVO_API_KEY        - xkeysib-... from brevo.com → SMTP & API → API Keys
 *   BREVO_SENDER_EMAIL   - a sender email verified in Brevo
 *   BREVO_SENDER_NAME    - display name shown in the From field
 */
export async function sendEmail({ to, subject, react }) {
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

        const data = await client.transactionalEmails.sendTransacEmail({
            sender: {
                name: process.env.BREVO_SENDER_NAME || "BudgetFLOW",
                email: process.env.BREVO_SENDER_EMAIL,
            },
            to: [{ email: to }],
            subject,
            htmlContent,
        });
        return { success: true, data };
    } catch (error) {
        console.error("Brevo send failed:", error?.message ?? error);
        return { success: false, error };
    }
}
