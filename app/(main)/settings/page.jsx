import { headers } from "next/headers";
import { getIngestStatus } from "@/actions/ingest-token";
import { PhoneBridgeCard } from "./_components/phone-bridge-card";
import { PasteSmsCard } from "./_components/paste-sms-card";

export const metadata = {
  title: "Settings | paisa",
};

export default async function SettingsPage() {
  const status = await getIngestStatus();

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const ingestUrl = `${protocol}://${host}/api/ingest/sms`;

  return (
    <div className="container mx-auto px-4 pb-16 pt-28">
      <header className="mb-8">
        <h1
          className="text-3xl font-bold text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
        >
          Settings
        </h1>
        <p className="mt-2 text-white/60">
          Manage how paisa connects to your devices.
        </p>
      </header>

      {/* Paste first: it needs no setup, so it is the way in. The phone bridge
          below automates the same pipeline once the user wants that. */}
      <div className="max-w-3xl space-y-6">
        <PasteSmsCard />
        <PhoneBridgeCard status={status} ingestUrl={ingestUrl} />
      </div>
    </div>
  );
}
