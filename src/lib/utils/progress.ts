/**
 * Progress score display helpers.
 * NOTE: Actual computation happens in Postgres via compute_progress_score().
 * These are display-only utilities for formatting scores in the UI.
 */

export type ScoreColorBand = "red" | "amber" | "teal" | "blue";

export function getScoreColor(score: number | null): ScoreColorBand {
  if (score === null) return "red";
  if (score < 50) return "red";
  if (score < 80) return "amber";
  if (score <= 100) return "teal";
  return "blue"; // > 100%
}

export function getScoreColorClass(score: number | null): string {
  const band = getScoreColor(score);
  const map: Record<ScoreColorBand, string> = {
    red: "text-brand-red",
    amber: "text-brand-amber",
    teal: "text-brand-teal",
    blue: "text-brand-blue",
  };
  return map[band];
}

export function formatScore(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 10) / 10}%`;
}

export function getUomLabel(uomType: string): string {
  const labels: Record<string, string> = {
    numeric_min: "Numeric (Min Target)",
    numeric_max: "Numeric (Max Target)",
    timeline: "Timeline",
    zero: "Zero-Based",
  };
  return labels[uomType] ?? uomType;
}
