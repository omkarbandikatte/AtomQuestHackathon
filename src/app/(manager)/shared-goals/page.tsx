import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Target } from "lucide-react";

export const metadata = { title: "Shared Goals — AtomQuest" };

export default async function SharedGoalsPage() {
  const user = await requireAuth("manager");
  const supabase = await createServerSupabaseClient();

  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  // Fetch shared goals pushed by this manager
  const { data: sharedLinks } = await supabase
    .from("shared_goal_links")
    .select(
      `id, created_at,
       source_goal:goals!shared_goal_links_source_goal_id_fkey(title, description, kpi_metric, kpi_target),
       target_employee:users!shared_goal_links_target_employee_id_fkey(full_name, email, department)`
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false }) as any;

  const links = sharedLinks ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Shared Goals</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Goals you have shared with your team members
          {cycle ? ` · ${cycle.name}` : ""}.
        </p>
      </div>

      {links.length === 0 ? (
        <EmptyState
          title="No shared goals yet"
          description="You haven't shared any goals with team members yet. Go to your team member's goal sheet to push a goal."
        />
      ) : (
        <div className="space-y-3">
          {links.map((link: any) => (
            <Card key={link.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 mt-0.5">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">
                        {link.source_goal?.title ?? "—"}
                      </p>
                      {link.source_goal?.description && (
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                          {link.source_goal.description}
                        </p>
                      )}
                      {(link.source_goal?.kpi_metric || link.source_goal?.kpi_target) && (
                        <p className="text-xs text-neutral-400 mt-1">
                          KPI: {link.source_goal.kpi_metric} — Target: {link.source_goal.kpi_target}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-neutral-700">{link.target_employee?.full_name}</p>
                    <p className="text-xs text-neutral-400">{link.target_employee?.department}</p>
                    <p className="text-xs text-neutral-300 mt-1">
                      {new Date(link.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
