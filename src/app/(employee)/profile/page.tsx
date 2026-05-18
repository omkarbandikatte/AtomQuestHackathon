import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Building, Shield, Calendar } from "lucide-react";

export const metadata = { title: "My Profile — AtomQuest" };

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect(ROUTES.LOGIN);

  // Resolve manager name separately (self-referencing FK not supported via PostgREST join)
  let managerName: string | null = null;
  if (profile.manager_id) {
    const { data: mgr } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", profile.manager_id)
      .single();
    managerName = mgr?.full_name ?? null;
  }

  const fields = [
    { icon: User, label: "Full Name", value: profile.full_name },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Shield, label: "Role", value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
    { icon: Building, label: "Department", value: profile.department ?? "Not assigned" },
    { icon: User, label: "Manager", value: managerName ?? "None" },
    { icon: Calendar, label: "Member since", value: new Date(profile.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue text-xl font-bold">
              {profile.full_name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-lg font-semibold">{profile.full_name}</p>
              <p className="text-sm text-neutral-500 font-normal">{profile.email}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.label} className="flex items-start gap-3 rounded-lg border p-3">
                <f.icon className="h-5 w-5 text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{f.label}</dt>
                  <dd className="text-sm font-medium text-neutral-900 mt-0.5">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
