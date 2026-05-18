import { exportToExcel, exportToCSV } from "@/lib/utils/export";
import type { GoalSheetWithGoals } from "@/types/app.types";

interface AchievementReportRow {
  employee: string;
  goal: string;
  uom: string;
  target: string;
  q1_actual: string;
  q2_actual: string;
  q3_actual: string;
  q4_actual: string;
  annual_score: string;
}

export class ExportService {
  static exportAchievementReport(
    sheets: GoalSheetWithGoals[],
    filename = "achievement_report",
    format: "excel" | "csv" = "excel",
  ): void {
    const rows: AchievementReportRow[] = sheets.flatMap((sheet) =>
      sheet.goals.map((goal) => {
        const getCheckin = (q: string) =>
          goal.checkins.find((c) => c.quarter === q);
        return {
          employee: sheet.employee.full_name,
          goal: goal.title,
          uom: goal.uom_type,
          target: goal.target_value?.toString() ?? goal.target_date ?? "—",
          q1_actual: getCheckin("Q1")?.actual_value?.toString() ?? "—",
          q2_actual: getCheckin("Q2")?.actual_value?.toString() ?? "—",
          q3_actual: getCheckin("Q3")?.actual_value?.toString() ?? "—",
          q4_actual: getCheckin("Q4")?.actual_value?.toString() ?? "—",
          annual_score:
            goal.checkins
              .reduce((sum, c) => sum + (c.progress_score ?? 0), 0)
              .toFixed(1) + "%",
        };
      }),
    );

    const columns = [
      { header: "Employee", key: "employee" },
      { header: "Goal", key: "goal" },
      { header: "UoM", key: "uom" },
      { header: "Target", key: "target" },
      { header: "Q1 Actual", key: "q1_actual" },
      { header: "Q2 Actual", key: "q2_actual" },
      { header: "Q3 Actual", key: "q3_actual" },
      { header: "Q4 Actual", key: "q4_actual" },
      { header: "Annual Score", key: "annual_score" },
    ];

    if (format === "excel") {
      exportToExcel(rows as unknown as Record<string, unknown>[], columns, filename);
    } else {
      exportToCSV(rows as unknown as Record<string, unknown>[], columns, filename);
    }
  }
}
