import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { OrgTreeClient } from "@/components/admin/OrgTreeClient";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { UserTable } from "@/components/admin/UserTable";

export const metadata = { title: "Users & Org — AtomQuest" };

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  // Use admin client so RLS never blocks the full user list
  const adminClient = createAdminClient();
  const { data: rawUsers } = await adminClient
    .from("users")
    .select("id, email, full_name, role, department, is_active, created_at, manager_id")
    .order("full_name");

  // Resolve manager names (self-referential FK can't be joined via PostgREST)
  const userList = rawUsers ?? [];
  const userMap = new Map(userList.map((u) => [u.id, u]));
  const users = userList.map((u) => ({
    ...u,
    manager: u.manager_id && userMap.has(u.manager_id)
      ? { id: u.manager_id, full_name: userMap.get(u.manager_id)!.full_name }
      : null,
  }));

  // Department stats
  const deptMap: Record<string, number> = {};
  users?.forEach((u: any) => {
    if (u.department) {
      deptMap[u.department] = (deptMap[u.department] ?? 0) + 1;
    }
  });

  const departments = Object.entries(deptMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const managers = users?.filter((u: any) => u.role === "manager") ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users & Org</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {users?.length ?? 0} users · Manage employees, managers, and reporting lines
          </p>
        </div>
        <UserFormDialog managers={managers.map((m: any) => ({ id: m.id, full_name: m.full_name }))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <UserTable users={users ?? []} />
        </div>
        <div className="space-y-4">
          <OrgTreeClient departments={departments} />
        </div>
      </div>
    </div>
  );
}
