"use client";

import { useState, useTransition } from "react";
import { Brain, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aiScoreGoalAction } from "@/app/actions/ai";
import type { GoalQualityScore } from "@/lib/ai/groq-service";
import { cn } from "@/lib/utils/cn";

interface GoalQualityScorerProps {
  title: string;
  description?: string;
  targetValue?: number | null;
  targetDate?: string | null;
  uomType?: string;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-brand-amber" : "bg-destructive";
  const icon =
    score >= 75 ? (
      <CheckCircle className="h-3 w-3 text-green-600" />
    ) : score >= 50 ? (
      <AlertTriangle className="h-3 w-3 text-brand-amber" />
    ) : (
      <XCircle className="h-3 w-3 text-destructive" />
    );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-mono font-medium">{score}/100</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function GoalQualityScorer({
  title,
  description,
  targetValue,
  targetDate,
  uomType,
}: GoalQualityScorerProps) {
  const [score, setScore] = useState<GoalQualityScore | null>(null);
  const [isScoring, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleScore() {
    setError(null);
    startTransition(async () => {
      const result = await aiScoreGoalAction(title, description, targetValue, targetDate, uomType);
      if (result.error) setError(result.error);
      else if (result.data) setScore(result.data);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleScore}
        disabled={isScoring || title.length < 3}
        className="gap-1 text-xs text-brand-blue hover:text-brand-blue/90"
      >
        {isScoring ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Brain className="h-3 w-3" />
        )}
        Score Quality
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {score && (
        <Card className="animate-in slide-in-from-top-2 duration-300 border-brand-blue/20">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">SMART Score</span>
              <span
                className={cn(
                  "text-lg font-bold",
                  score.overall_score >= 75
                    ? "text-green-600"
                    : score.overall_score >= 50
                      ? "text-brand-amber"
                      : "text-destructive",
                )}
              >
                {score.overall_score}/100
              </span>
            </div>

            <div className="space-y-2">
              <ScoreBar score={score.specific.score} label="Specific" />
              <ScoreBar score={score.measurable.score} label="Measurable" />
              <ScoreBar score={score.achievable.score} label="Achievable" />
              <ScoreBar score={score.relevant.score} label="Relevant" />
              <ScoreBar score={score.time_bound.score} label="Time-bound" />
            </div>

            {score.suggestions.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-neutral-500 mb-1">Suggestions:</p>
                <ul className="text-xs text-neutral-600 space-y-1">
                  {score.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-1">
                      <span className="text-brand-teal">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
