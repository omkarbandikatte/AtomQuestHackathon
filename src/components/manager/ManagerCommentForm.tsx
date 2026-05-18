"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addManagerCommentAction } from "@/app/actions/checkins";
import { managerCheckinCommentSchema } from "@/validations/checkin-schema";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import type { z } from "zod";

type CommentValues = z.infer<typeof managerCheckinCommentSchema>;

interface Props {
  checkinId: string | null;
  existingComment: string | null;
  managerId: string;
}

export function ManagerCommentForm({ checkinId, existingComment, managerId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CommentValues>({
    resolver: zodResolver(managerCheckinCommentSchema),
    defaultValues: {
      checkin_id: checkinId ?? "",
      manager_comment: existingComment ?? "",
    },
  });

  if (!checkinId) {
    return (
      <p className="text-xs text-neutral-400 italic">
        No check-in submitted yet — comment available after employee logs progress.
      </p>
    );
  }

  function onSubmit(values: CommentValues) {
    startTransition(async () => {
      const result = await addManagerCommentAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Comment saved");
        setIsEditing(false);
      }
    });
  }

  if (!isEditing && existingComment) {
    return (
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-neutral-600 bg-blue-50 rounded p-2 flex-1">
          <MessageSquare className="inline h-3 w-3 mr-1 text-brand-blue" />
          {existingComment}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-7"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <input type="hidden" {...register("checkin_id")} />
      <Textarea
        placeholder="Add check-in comment for this goal…"
        rows={2}
        {...register("manager_comment")}
        aria-invalid={!!errors.manager_comment}
        className="text-xs"
      />
      {errors.manager_comment && (
        <p className="text-xs text-brand-red">{errors.manager_comment.message}</p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="bg-brand-blue hover:bg-brand-blue/90 h-7 text-xs"
        >
          Save Comment
        </Button>
        {existingComment && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
