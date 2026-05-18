"use client";

import { useState, useTransition } from "react";
import { ShieldAlert, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aiAssessRiskAction } from "@/app/actions/ai";
import type { RiskAssessment } from "@/lib/ai/groq-service";
import { cn } from "@/lib/utils/cn";

interface RiskDetectorProps {
  goalId: string;
  goalTitle: string;
}

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const RISK_ICONS: Record<string, React.ReactNode> = {
  low: <CheckCircle className="h-4 w-4 text-green-600" />,
  medium: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  high: <ShieldAlert className="h-4 w-4 text-orange-600" />,
  critical: <ShieldAlert className="h-4 w-4 text-red-600" />,
};

export function RiskDetector({ goalId, goalTitle }: RiskDetectorProps) {
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [isAssessing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAssess() {
    setError(null);
    startTransition(async () => {
      const result = await aiAssessRiskAction(goalId);
      if (result.error) setError(result.error);
      else if (result.data) setRisk(result.data);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAssess}
        disabled={isAssessing}
        className="gap-1 text-xs"
      >
        {isAssessing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ShieldAlert className="h-3 w-3" />
        )}
        Assess Risk
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {risk && (
        <Card className={cn("animate-in fade-in duration-300 border", RISK_COLORS[risk.risk_level])}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {RISK_ICONS[risk.risk_level]}
                <span className="text-xs font-semibold uppercase">{risk.risk_level} Risk</span>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {risk.risk_score}/100
              </Badge>
            </div>

            <ul className="text-xs space-y-1">
              {risk.factors.map((f, i) => (
                <li key={i} className="flex gap-1">
                  <span>•</span> {f}
                </li>
              ))}
            </ul>

            <p className="text-xs font-medium pt-1 border-t">
              💡 {risk.recommendation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
