import Link from "next/link";
import { getUserGroups } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, Receipt } from "lucide-react";

export default async function GroupsPage() {
  const groups = await getUserGroups();

  return (
    <div className="px-4 md:px-8 py-10 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">
            Bill splitting
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            Splitwise
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Split bills equally and send reminders. No login needed for members.
          </p>
        </div>
        <Link href="/groups/new">
          <Button className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            New group
          </Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="bg-ink-soft border-white/10">
      <CardContent className="py-16 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mb-4">
          <Users className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Splitwise groups yet</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
          Create a group, add some members, and start logging shared expenses.
        </p>
        <Link href="/groups/new" className="inline-block mt-5">
          <Button className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            Create your first group
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function GroupCard({ group }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="group relative overflow-hidden bg-ink-soft border-white/10 hover:border-brand/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-brand/10 blur-2xl group-hover:bg-brand/20 transition-colors"
        />
        <CardContent className="pt-6 relative">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-brand text-ink flex items-center justify-center shadow-md shadow-brand/30">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              {new Date(group.updatedAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white truncate">
            {group.name}
          </h3>
          {group.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {group._count.members} members
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              {group._count.expenses} expenses
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
