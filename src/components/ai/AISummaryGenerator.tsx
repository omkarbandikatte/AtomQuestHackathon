"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2, TrendingUp, AlertTriangle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aiGenerateSummaryAction } from "@/app/actions/ai";
import type { QuarterlySummary } from "@/lib/ai/groq-service";
import { cn } from "@/lib/utils/cn";

interface AISummaryGeneratorProps {
  employeeId: string;
  employeeName: string;
  quarter: string;
}

export function AISummaryGenerator({ employeeId, employeeName, quarter }: AISummaryGeneratorProps) {
  const [summary, setSummary] = useState<QuarterlySummary | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await aiGenerateSummaryAction(employeeId, quarter);
      if (result.error) setError(result.error);
      else if (result.data) setSummary(result.data);
    });
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        variant="outline"
        className="gap-2 border-brand-blue/30 text-brand-blue hover:bg-brand-blue/5"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Generate {quarter} Review Summary
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {summary && (
        <Card className="animate-in slide-in-from-top-2 duration-300 border-brand-blue/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{quarter} Review — {employeeName}</span>
              <Badge
                className={cn(
                  "text-xs",
                  summary.overall_rating === "Exceeds Expectations"
                    ? "bg-green-100 text-green-800"
                    : summary.overall_rating === "Meets Expectations"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800",
                )}
              >
                {summary.overall_rating}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-neutral-700">{summary.progress_summary}</p>
            </div>

            {summary.achievements.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
                  <Award className="h-3 w-3" /> Achievements
                </h4>
                <ul className="space-y-1">
                  {summary.achievements.map((a, i) => (
                    <li key={i} className="text-xs text-neutral-600 flex gap-1">
                      <span className="text-green-500">✓</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.risks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3" /> Risks
                </h4>
                <ul className="space-y-1">
                  {summary.risks.map((r, i) => (
                    <li key={i} className="text-xs text-neutral-600 flex gap-1">
                      <span className="text-amber-500">⚠</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold text-brand-blue flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3" /> Suggested Feedback
              </h4>
              <p className="text-xs text-neutral-600 italic">{summary.suggested_feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
