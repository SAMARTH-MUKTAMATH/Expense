import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateGroupForm } from "../_components/create-group-form";

export default function NewGroupPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Splitwise
      </Link>

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">
          Splitwise
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          New group
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Add a group name and the people you'll be splitting bills with.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-ink-soft p-6 md:p-8">
        <CreateGroupForm />
      </div>
    </div>
  );
}
