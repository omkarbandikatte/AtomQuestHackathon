/**
 * Notification utility — persists notifications to the database
 * and logs to console in development.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "goal_sheet_approved"
  | "goal_sheet_returned"
  | "goal_sheet_submitted"
  | "shared_goal_pushed"
  | "checkin_window_open";

interface NotificationPayload {
  sheet_id?: string;
  manager_id?: string;
  comment?: string;
  [key: string]: unknown;
}

const TYPE_MAP: Record<NotificationType, "info" | "approval" | "rejection" | "reminder" | "unlock"> = {
  goal_sheet_approved: "approval",
  goal_sheet_returned: "rejection",
  goal_sheet_submitted: "info",
  shared_goal_pushed: "info",
  checkin_window_open: "reminder",
};

const TITLE_MAP: Record<NotificationType, string> = {
  goal_sheet_approved: "Goal Sheet Approved",
  goal_sheet_returned: "Goal Sheet Returned",
  goal_sheet_submitted: "Goal Sheet Submitted for Approval",
  shared_goal_pushed: "Shared Goal Assigned",
  checkin_window_open: "Check-in Window Open",
};

const BODY_MAP: Record<NotificationType, (p: NotificationPayload) => string> = {
  goal_sheet_approved: () => "Your goal sheet has been approved and locked.",
  goal_sheet_returned: (p) => p.comment ? `Returned: ${p.comment}` : "Your goal sheet was returned for rework.",
  goal_sheet_submitted: () => "A goal sheet has been submitted for your approval.",
  shared_goal_pushed: () => "A shared goal has been assigned to you.",
  checkin_window_open: () => "A new quarterly check-in window is now open.",
};

/**
 * Queue a notification for a user — persists to the notifications table.
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload,
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Notification] → ${type} for user ${userId}`, payload);
  }

  try {
    const supabase = createAdminClient();

    await supabase.from("notifications").insert({
      user_id: userId,
      title: TITLE_MAP[type],
      body: BODY_MAP[type](payload),
      type: TYPE_MAP[type],
      is_read: false,
    });
  } catch (err) {
    console.error("[Notification] Failed to persist:", err);
  }
}
