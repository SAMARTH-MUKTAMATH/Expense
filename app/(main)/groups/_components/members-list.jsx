"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addGroupMember, removeGroupMember } from "@/actions/groups";

export function MembersList({ group }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setAdding(false);
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email required");
      return;
    }
    try {
      setBusy(true);
      const res = await addGroupMember(group.id, { name, email });
      if (!res?.success) throw new Error("Could not add");
      toast.success(`${res.data.name} added`);
      reset();
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (memberId) => {
    try {
      const res = await removeGroupMember(memberId);
      if (!res?.success) throw new Error("Could not remove");
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand" />
          <p className="text-sm font-semibold text-white">Members</p>
        </div>
        {!adding && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            className="h-7 text-xs text-brand hover:bg-brand/10 hover:text-brand gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      <ul className="space-y-1.5">
        {group.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-2 rounded-lg bg-ink border border-white/8 px-3 py-2"
          >
            <span className="h-6 w-6 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
              {m.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate leading-tight">
                {m.name}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{m.email}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleRemove(m.id)}
              className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
              aria-label={`Remove ${m.name}`}
              title="Remove"
            >
              <X className="h-3 w-3" />
            </Button>
          </li>
        ))}
      </ul>

      {adding && (
        <div className="mt-3 space-y-2 rounded-lg border border-brand/30 bg-brand/5 p-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 bg-ink border-white/15 text-white text-sm"
            autoFocus
          />
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 bg-ink border-white/15 text-white text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
              onClick={reset}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 h-7 text-xs btn-primary"
              onClick={handleAdd}
              disabled={busy}
            >
              {busy ? "..." : "Add"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
