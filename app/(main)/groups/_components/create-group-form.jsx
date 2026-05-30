"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";
import { createGroup } from "@/actions/groups";
import { groupSchema } from "@/app/lib/schema";

export function CreateGroupForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      members: [
        { name: "", email: "" },
        { name: "", email: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const {
    loading,
    fn: submit,
    data: result,
  } = useFetch(createGroup);

  useEffect(() => {
    if (result?.success && result?.data?.id) {
      toast.success("Group created");
      router.push(`/groups/${result.data.id}`);
    }
  }, [result, router]);

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Group name</label>
        <Input
          placeholder="e.g. Goa Trip, Roomies, Lunch Crew"
          className="bg-ink border-white/15 text-white"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white">
          Description <span className="text-gray-500">(optional)</span>
        </label>
        <Input
          placeholder="Short note about this group"
          className="bg-ink border-white/15 text-white"
          {...register("description")}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white">Members</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ name: "", email: "" })}
            className="h-7 text-xs text-brand hover:bg-brand/10 hover:text-brand gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add member
          </Button>
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start"
            >
              <div>
                <Input
                  placeholder="Name"
                  className="bg-ink border-white/15 text-white"
                  {...register(`members.${index}.name`)}
                />
                {errors.members?.[index]?.name && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.members[index].name.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  className="bg-ink border-white/15 text-white"
                  {...register(`members.${index}.email`)}
                />
                {errors.members?.[index]?.email && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.members[index].email.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                aria-label="Remove member"
                className="h-10 w-10 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {errors.members?.root && (
          <p className="text-sm text-red-400">{errors.members.root.message}</p>
        )}
        {errors.members?.message && (
          <p className="text-sm text-red-400">{errors.members.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 btn-primary"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create group"}
        </Button>
      </div>
    </form>
  );
}
