"use client";

import { useState, useTransition } from "react";
import { Brain, Loader2, TrendingUp, AlertTriangle, Lightbulb, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aiPerformanceInsightsAction } from "@/app/actions/ai";
import type { PerformanceInsight } from "@/lib/ai/groq-service";

export function AIInsightsDashboard() {
  const [insights, setInsights] = useState<PerformanceInsight | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await aiPerformanceInsightsAction();
      if (result.error) setError(result.error);
      else if (result.data) setInsights(result.data);
    });
  }

  return (
    <Card className="border-brand-blue/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-brand-blue" />
            AI Performance Insights
          </CardTitle>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            size="sm"
            className="gap-1 bg-brand-blue hover:bg-brand-blue/90"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Brain className="h-3 w-3" />
            )}
            Generate Insights
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!insights && !isGenerating && (
          <p className="text-sm text-neutral-500 text-center py-6">
            Click &quot;Generate Insights&quot; to get AI-powered analysis of organizational performance.
          </p>
        )}

        {isGenerating && (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-neutral-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing performance data...
          </div>
        )}

        {insights && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Key Insights */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> Key Insights
              </h4>
              <div className="space-y-2">
                {insights.insights.map((insight, i) => (
                  <div
                    key={i}
                    className="flex gap-2 p-2 rounded-lg bg-brand-blue/5 border border-brand-blue/10"
                  >
                    <span className="text-brand-blue font-bold text-xs mt-0.5">{i + 1}.</span>
                    <p className="text-xs text-neutral-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            {insights.top_performers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-green-700 uppercase flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> Top Performers
                </h4>
                <ul className="space-y-1">
                  {insights.top_performers.map((p, i) => (
                    <li key={i} className="text-xs text-neutral-600 flex gap-1">
                      <span className="text-green-500">★</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas of Concern */}
            {insights.areas_of_concern.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-amber-700 uppercase flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Areas of Concern
                </h4>
                <ul className="space-y-1">
                  {insights.areas_of_concern.map((c, i) => (
                    <li key={i} className="text-xs text-neutral-600 flex gap-1">
                      <span className="text-amber-500">⚠</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-xs font-semibold text-brand-teal uppercase flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Recommendations
                </h4>
                <ul className="space-y-1">
                  {insights.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-neutral-600 flex gap-1">
                      <span className="text-brand-teal">→</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
