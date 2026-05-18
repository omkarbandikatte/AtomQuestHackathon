"use client";

import { exportToExcel, exportToCSV } from "@/lib/utils/export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Props {
  cycleId: string;
  format: "xlsx" | "csv";
}

const EXPORT_COLUMNS = [
  { header: "Employee", key: "employee_name" },
  { header: "Department", key: "department" },
  { header: "Goal", key: "goal_title" },
  { header: "Thrust Area", key: "thrust_area" },
  { header: "UoM", key: "uom_type" },
  { header: "Target", key: "target_value" },
  { header: "Weightage (%)", key: "weightage" },
  { header: "Q1 Actual", key: "q1_actual" },
  { header: "Q1 Score", key: "q1_score" },
  { header: "Q2 Actual", key: "q2_actual" },
  { header: "Q2 Score", key: "q2_score" },
  { header: "Q3 Actual", key: "q3_actual" },
  { header: "Q3 Score", key: "q3_score" },
  { header: "Q4 Actual", key: "q4_actual" },
  { header: "Q4 Score", key: "q4_score" },
];

export function ReportExportButton({ cycleId, format }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const supabase = createClient();
      const { data: goals } = await supabase
        .from("goals")
        .select(
          `
          title, thrust_area, uom_type, target_value, weightage,
          checkins(quarter, actual_value, progress_score),
          goal_sheets!inner(
            cycle_id,
            employee:users!goal_sheets_employee_fk(full_name, department)
          )
        `,
        )
        .eq("goal_sheets.cycle_id", cycleId);

      if (!goals) {
        toast.error("No data to export");
        return;
      }

      const rows = goals.map((g) => {
        const getCheckin = (q: string) => g.checkins?.find((c: { quarter: string }) => c.quarter === q);
        return {
          employee_name: (g.goal_sheets as { employee?: { full_name?: string } })?.employee?.full_name ?? "—",
          department: (g.goal_sheets as { employee?: { department?: string } })?.employee?.department ?? "—",
          goal_title: g.title,
          thrust_area: g.thrust_area,
          uom_type: g.uom_type,
          target_value: g.target_value ?? "—",
          weightage: g.weightage,
          q1_actual: getCheckin("Q1")?.actual_value ?? "—",
          q1_score: getCheckin("Q1")?.progress_score ?? "—",
          q2_actual: getCheckin("Q2")?.actual_value ?? "—",
          q2_score: getCheckin("Q2")?.progress_score ?? "—",
          q3_actual: getCheckin("Q3")?.actual_value ?? "—",
          q3_score: getCheckin("Q3")?.progress_score ?? "—",
          q4_actual: getCheckin("Q4")?.actual_value ?? "—",
          q4_score: getCheckin("Q4")?.progress_score ?? "—",
        };
      });

      const filename = `AtomQuest_Achievement_Report_${new Date().toISOString().split("T")[0]}`;
      if (format === "xlsx") {
        exportToExcel(rows, EXPORT_COLUMNS, filename);
      } else {
        exportToCSV(rows, EXPORT_COLUMNS, filename);
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    });
  }

  return (
    <Button
      variant="outline"
      disabled={isPending || !cycleId}
      onClick={handleExport}
      className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
    >
      <Download className="mr-2 h-4 w-4" />
      Export {format.toUpperCase()}
    </Button>
  );
}
