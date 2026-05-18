"use server";

import {
  generateGoalFromIntent,
  scoreGoalQuality,
  generateQuarterlySummary,
  assessGoalRisk,
  generatePerformanceInsights,
  type AISuggestedGoal,
  type GoalQualityScore,
  type QuarterlySummary,
  type RiskAssessment,
  type PerformanceInsight,
} from "@/lib/ai/groq-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResponse } from "@/types/app.types";

// ── 1. AI Goal Writing Assistant ────────────────────────────

export async function aiGenerateGoalAction(
  intent: string,
): Promise<ActionResponse<AISuggestedGoal>> {
  try {
    if (!intent || intent.trim().length < 3) {
      return { data: null, error: "Please describe your goal intent (at least 3 characters)" };
    }
    const goal = await generateGoalFromIntent(intent.trim());
    return { data: goal, error: null };
  } catch (e: any) {
    console.error("AI goal generation error:", e);
    return { data: null, error: "Failed to generate goal. Please try again." };
  }
}

// ── 2. AI Goal Quality Scoring ──────────────────────────────

export async function aiScoreGoalAction(
  title: string,
  description?: string,
  targetValue?: number | null,
  targetDate?: string | null,
  uomType?: string,
): Promise<ActionResponse<GoalQualityScore>> {
  try {
    if (!title || title.trim().length < 3) {
      return { data: null, error: "Goal title is required" };
    }
    const score = await scoreGoalQuality(
      title,
      description,
      targetValue ?? null,
      targetDate ?? null,
      uomType ?? "numeric_min",
    );
    return { data: score, error: null };
  } catch (e: any) {
    console.error("AI scoring error:", e);
    return { data: null, error: "Failed to score goal. Please try again." };
  }
}

// ── 3. AI Quarterly Summary Generator ───────────────────────

export async function aiGenerateSummaryAction(
  employeeId: string,
  quarter: string,
): Promise<ActionResponse<QuarterlySummary>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    const admin = createAdminClient();

    // Get employee info
    const { data: employee } = await admin
      .from("users")
      .select("full_name")
      .eq("id", employeeId)
      .single();

    if (!employee) return { data: null, error: "Employee not found" };

    // Get goals + checkins
    const { data: sheets } = await admin
      .from("goal_sheets")
      .select("id, goals(id, title, weightage, checkins(progress_score, quarter))")
      .eq("employee_id", employeeId)
      .limit(1);

    const sheet = sheets?.[0];
    if (!sheet) return { data: null, error: "No goal sheet found" };

    const goals = ((sheet as any).goals ?? []).map((g: any) => {
      const checkin = g.checkins?.find((c: any) => c.quarter === quarter);
      return {
        title: g.title,
        weightage: g.weightage,
        progress: checkin?.progress_score ?? 0,
        status: checkin ? "checked_in" : "no_checkin",
      };
    });

    const summary = await generateQuarterlySummary(employee.full_name, goals, quarter);
    return { data: summary, error: null };
  } catch (e: any) {
    console.error("AI summary error:", e);
    return { data: null, error: "Failed to generate summary." };
  }
}

// ── 4. Intelligent Risk Detection ───────────────────────────

export async function aiAssessRiskAction(
  goalId: string,
): Promise<ActionResponse<RiskAssessment>> {
  try {
    const admin = createAdminClient();

    const { data: goal } = await admin
      .from("goals")
      .select("title, checkins(progress_score, quarter)")
      .eq("id", goalId)
      .single();

    if (!goal) return { data: null, error: "Goal not found" };

    const checkins = (goal as any).checkins ?? [];
    const latestCheckin = checkins[checkins.length - 1];
    const progress = latestCheckin?.progress_score ?? 0;
    const currentQuarter = latestCheckin?.quarter ?? "Q1";
    const missedQuarters = 4 - checkins.length;

    const risk = await assessGoalRisk(
      goal.title,
      progress,
      currentQuarter,
      4,
      missedQuarters,
    );
    return { data: risk, error: null };
  } catch (e: any) {
    console.error("AI risk error:", e);
    return { data: null, error: "Failed to assess risk." };
  }
}

// ── 6. AI Performance Insights ──────────────────────────────

export async function aiPerformanceInsightsAction(): Promise<ActionResponse<PerformanceInsight>> {
  try {
    const admin = createAdminClient();

    const { data: users } = await admin
      .from("users")
      .select("department")
      .eq("is_active", true)
      .eq("role", "employee");

    const departments = [...new Set((users ?? []).map((u) => u.department).filter(Boolean))] as string[];

    // Build department stats
    const departmentData = await Promise.all(
      departments.map(async (dept) => {
        const { data: deptUsers } = await admin
          .from("users")
          .select("id")
          .eq("department", dept)
          .eq("role", "employee");

        const ids = (deptUsers ?? []).map((u) => u.id);
        if (ids.length === 0) return { department: dept, completion: 0, onTime: 0, avgScore: 0 };

        const { data: sheets } = await admin
          .from("goal_sheets")
          .select("status, approved_at")
          .in("employee_id", ids);

        const total = sheets?.length ?? 1;
        const approved = sheets?.filter((s) => s.status === "approved").length ?? 0;
        const completion = Math.round((approved / total) * 100);

        return { department: dept, completion, onTime: completion, avgScore: Math.round(completion * 0.9) };
      }),
    );

    const insights = await generatePerformanceInsights(departmentData);
    return { data: insights, error: null };
  } catch (e: any) {
    console.error("AI insights error:", e);
    return { data: null, error: "Failed to generate insights." };
  }
}
