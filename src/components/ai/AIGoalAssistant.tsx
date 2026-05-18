"use client";

import { useState, useTransition } from "react";
import { Sparkles, Wand2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aiGenerateGoalAction } from "@/app/actions/ai";
import type { AISuggestedGoal } from "@/lib/ai/groq-service";

interface AIGoalAssistantProps {
  onApplyGoal: (goal: AISuggestedGoal) => void;
}

export function AIGoalAssistant({ onApplyGoal }: AIGoalAssistantProps) {
  const [intent, setIntent] = useState("");
  const [suggestion, setSuggestion] = useState<AISuggestedGoal | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function handleGenerate() {
    setError(null);
    setSuggestion(null);
    startTransition(async () => {
      const result = await aiGenerateGoalAction(intent);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setSuggestion(result.data);
      }
    });
  }

  function handleApply() {
    if (suggestion) {
      onApplyGoal(suggestion);
      setSuggestion(null);
      setIntent("");
      setIsOpen(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-brand-teal/30 text-brand-teal hover:bg-brand-teal/5"
      >
        <Sparkles className="h-4 w-4" />
        AI Goal Assistant
      </Button>
    );
  }

  return (
    <Card className="border-brand-teal/30 bg-gradient-to-br from-brand-teal/5 to-brand-blue/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-teal" />
          AI Goal Writing Assistant
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="ml-auto text-neutral-400 hover:text-neutral-600 text-xs"
          >
            Close
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g., Improve customer retention, Reduce bug reports..."
            className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            onKeyDown={(e) => e.key === "Enter" && !isGenerating && handleGenerate()}
          />
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || intent.trim().length < 3}
            className="bg-brand-teal hover:bg-brand-teal/90 gap-1"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {suggestion && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-white rounded-lg p-3 border border-brand-teal/20 space-y-2">
              <div>
                <span className="text-xs font-medium text-neutral-500">Generated Goal:</span>
                <p className="text-sm font-semibold text-neutral-900">{suggestion.title}</p>
              </div>
              {suggestion.description && (
                <p className="text-xs text-neutral-600">{suggestion.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="teal" className="text-xs">
                  {suggestion.thrust_area}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  UoM: {suggestion.uom_type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {suggestion.weightage}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                <div>
                  <span className="font-medium">KPI:</span> {suggestion.kpi}
                </div>
                <div>
                  <span className="font-medium">Timeline:</span> {suggestion.timeline}
                </div>
                {suggestion.target_value && (
                  <div>
                    <span className="font-medium">Target:</span> {suggestion.target_value}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleApply}
                size="sm"
                className="bg-brand-teal hover:bg-brand-teal/90 gap-1"
              >
                <Check className="h-3 w-3" />
                Apply to Form
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
