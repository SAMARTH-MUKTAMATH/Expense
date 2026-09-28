import { CircleUser, Smartphone, ClipboardPaste, LifeBuoy } from "lucide-react";
import { getIngestStatus } from "@/actions/ingest-token";
import { checkUser } from "@/lib/checkUser";
import { PhoneBridgeCard } from "./_components/phone-bridge-card";
import { PasteSmsCard } from "./_components/paste-sms-card";
import { AccountCard } from "./_components/account-card";
import { HelpCard } from "./_components/help-card";

export const metadata = {
  title: "Settings | BudgetFLOW",
};

const SECTIONS = [
  { id: "account", label: "Account", Icon: CircleUser },
  { id: "tracking", label: "Automatic tracking", Icon: Smartphone },
  { id: "import", label: "Import a message", Icon: ClipboardPaste },
  { id: "help", label: "Help", Icon: LifeBuoy },
];

function SettingsSection({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const [user, status] = await Promise.all([checkUser(), getIngestStatus()]);

  return (
    <div className="px-4 md:px-8 py-10 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">
          Preferences
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-sm md:text-base text-gray-400 max-w-2xl">
          Your account, how payments reach BudgetFLOW, and where to get help.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <ul className="sticky top-24 space-y-1">
            {SECTIONS.map(({ id, label, Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon size={16} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-3xl space-y-10">
          <SettingsSection
            id="account"
            title="Account"
            description="Your sign-in details. Name, email, password and security are managed by your login provider."
          >
            <AccountCard
              name={user?.name}
              email={user?.email}
              memberSince={user?.createdAt?.toISOString() ?? null}
            />
          </SettingsSection>

          <SettingsSection
            id="tracking"
            title="Automatic tracking"
            description="Payments from your bank SMS are added the moment they arrive, even when the app is closed. Needs the BudgetFLOW Android app."
          >
            <PhoneBridgeCard status={status} />
          </SettingsSection>

          <SettingsSection
            id="import"
            title="Import a message"
            description="No app on this phone? Copy a bank message and paste it here to log it by hand."
          >
            <PasteSmsCard />
          </SettingsSection>

          <SettingsSection
            id="help"
            title="Help"
            description="Replay the tour or check what the auto-import was unsure about."
          >
            <HelpCard />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
