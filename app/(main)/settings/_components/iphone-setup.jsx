"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Plus, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateIngestToken } from "@/actions/ingest-token";

const SHORTCUT_URL = process.env.NEXT_PUBLIC_IOS_SHORTCUT_URL;
const TRIGGER_WORDS = ["debited", "credited", "spent"];

function Step({ number, title, children }) {
  return (
    <li className="space-y-2">
      <p className="text-sm font-medium text-white">
        {number}. {title}
      </p>
      {children}
    </li>
  );
}

function Hint({ children }) {
  return <p className="text-sm text-white/60">{children}</p>;
}

function KeyStep({ hasToken }) {
  const [token, setToken] = useState(null);
  const [pending, startTransition] = useTransition();

  const createKey = () => {
    startTransition(async () => {
      try {
        const result = await generateIngestToken();
        setToken(result.token);
      } catch (error) {
        toast.error(error.message || "Could not create a key.");
      }
    });
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Key copied");
    } catch {
      toast.error("Could not copy. Press and hold the key to copy it.");
    }
  };

  if (token) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] p-3">
          <code className="min-w-0 flex-1 select-all break-all text-xs text-brand">
            {token}
          </code>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={copyKey}
            className="shrink-0 gap-1.5 text-white hover:bg-white/5"
          >
            <Copy size={14} />
            Copy
          </Button>
        </div>
        <p className="text-xs text-white/40">
          Shown only once. You will paste it into the shortcut in the next step.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={createKey}
        disabled={pending}
        className="btn-primary gap-2"
      >
        <KeyRound size={16} />
        {hasToken ? "Create a new key" : "Create my key"}
      </Button>
      {hasToken && (
        <p className="text-xs text-white/40">
          A new key replaces the old one, so any phone already connected stops
          sending messages.
        </p>
      )}
    </div>
  );
}

function BuildShortcutYourself() {
  const ingestUrl = `${window.location.origin}/api/ingest/sms`;

  return (
    <details className="rounded-lg border border-white/10 bg-[#0a0a0a] p-3 text-sm text-white/60">
      <summary className="cursor-pointer text-white">
        Build the shortcut yourself
      </summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>
          Open Shortcuts, tap <span className="text-white">+</span>, and name it{" "}
          <span className="text-white">BudgetFLOW</span>.
        </li>
        <li>
          Add a <span className="text-white">Text</span> action and paste your
          key into it.
        </li>
        <li>
          Add <span className="text-white">Get Contents of URL</span> with this
          address:
          <code className="mt-1 block break-all text-xs text-brand">
            {ingestUrl}
          </code>
        </li>
        <li>
          Tap the arrow on that action. Set Method to{" "}
          <span className="text-white">POST</span>.
        </li>
        <li>
          Add a header named <span className="text-white">Authorization</span>{" "}
          with the value <span className="text-white">Bearer </span>followed by
          the Text from step 2.
        </li>
        <li>
          Set Request Body to <span className="text-white">JSON</span> and add
          two fields: <span className="text-white">body</span> set to Shortcut
          Input → Content, and <span className="text-white">sender</span> set to
          Shortcut Input → Sender.
        </li>
      </ol>
    </details>
  );
}

export function IphoneSetup({ hasToken }) {
  return (
    <ol className="space-y-6">
      <Step number={1} title="Create your key">
        <KeyStep hasToken={hasToken} />
      </Step>

      <Step number={2} title="Add the BudgetFLOW shortcut">
        {SHORTCUT_URL ? (
          <>
            <Button asChild className="btn-primary gap-2">
              <a href={SHORTCUT_URL}>
                <Plus size={16} />
                Add shortcut
              </a>
            </Button>
            <Hint>When Shortcuts asks for your key, paste it.</Hint>
          </>
        ) : (
          <BuildShortcutYourself />
        )}
      </Step>

      <Step number={3} title="Run it on every bank message">
        <Hint>
          In Shortcuts, open <span className="text-white">Automation</span>, tap{" "}
          <span className="text-white">+</span>, then{" "}
          <span className="text-white">Message</span>. Set{" "}
          <span className="text-white">Message Contains</span> to{" "}
          <span className="text-white">debited</span>, choose{" "}
          <span className="text-white">Run Immediately</span>, then add a{" "}
          <span className="text-white">Run Shortcut</span> action that runs
          BudgetFLOW with Shortcut Input.
        </Hint>
        <Hint>
          Repeat for{" "}
          {TRIGGER_WORDS.slice(1).map((word, i) => (
            <span key={word}>
              {i > 0 && " and "}
              <span className="text-white">{word}</span>
            </span>
          ))}
          . Needs iOS 17 or newer to run without asking each time.
        </Hint>
      </Step>

      <Step number={4} title="Add BudgetFLOW to your Home Screen">
        <Hint>
          In Safari, tap <Share size={14} className="inline align-text-bottom" />{" "}
          Share, then <span className="text-white">Add to Home Screen</span>.
          It opens full screen, like an app.
        </Hint>
      </Step>
    </ol>
  );
}
