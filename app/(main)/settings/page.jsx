import { getIngestStatus } from "@/actions/ingest-token";
import { PhoneBridgeCard } from "./_components/phone-bridge-card";
import { PasteSmsCard } from "./_components/paste-sms-card";

export const metadata = {
  title: "Settings | paisa",
};

export default async function SettingsPage() {
  const status = await getIngestStatus();

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

      <div className="max-w-3xl space-y-6">
        <PhoneBridgeCard status={status} />
        <PasteSmsCard />
      </div>
    </div>
  );
}
