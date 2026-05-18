import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle, AlertTriangle, FileText, Share2 } from "lucide-react";

export const metadata = { title: "Notifications — AtomQuest" };

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  approval: { icon: CheckCircle, color: "text-brand-green" },
  rejection: { icon: AlertTriangle, color: "text-brand-amber" },
  info: { icon: FileText, color: "text-brand-blue" },
  reminder: { icon: Bell, color: "text-brand-teal" },
  unlock: { icon: Share2, color: "text-brand-teal" },
};

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
        {items.length > 0 && (
          <span className="text-sm text-neutral-500">{items.length} notification{items.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
            <p className="text-neutral-500">No notifications yet.</p>
            <p className="text-sm text-neutral-400 mt-1">
              You&apos;ll see notifications here when your goals are approved, returned, or when check-in windows open.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => {
            const config = TYPE_CONFIG[n.type] ?? { icon: Bell, color: "text-neutral-500" };
            const Icon = config.icon;
            return (
              <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
                <CardContent className="flex items-start gap-3 py-3 px-4">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                    {n.body && <p className="text-sm text-neutral-500 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
