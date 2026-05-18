import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { ApprovalDetailClient } from "@/components/manager/ApprovalDetailClient";

export const metadata = { title: "Review Goal Sheet — AtomQuest" };

interface Props {
  params: { sheetId: string };
}

export default async function ApprovalDetailPage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select(
      `
      *, 
      goals(*),
      employee:users!goal_sheets_employee_fk(id, full_name, email, department)
    `,
    )
    .eq("id", params.sheetId)
    .single();

  if (!sheet) notFound();

  // Verify this manager owns the relationship
  const employee = sheet.employee as unknown as { id: string; full_name: string; email: string; department: string | null } | null;
  if (employee) {
    const { data: emp } = await supabase
      .from("users")
      .select("manager_id")
      .eq("id", employee.id)
      .single();

    if (emp?.manager_id !== user.id) {
      redirect(ROUTES.APPROVALS);
    }
  }

  return <ApprovalDetailClient sheet={sheet as any} managerId={user.id} />;
}
