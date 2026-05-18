import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  total: number;
}

export function CompletionBarChart({ segments, total }: Props) {
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sheet Completion Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-400 py-4 text-center">No sheets in current cycle</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sheet Completion Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked bar */}
        <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                style={{
                  width: `${(s.value / total) * 100}%`,
                  backgroundColor: s.color,
                }}
                title={`${s.label}: ${s.value}`}
                className="transition-all duration-500"
              />
            ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {segments.map((s) => {
            const pct = Math.round((s.value / total) * 100);
            return (
              <div key={s.label} className="flex items-start gap-2">
                <span
                  className="mt-1 inline-block h-3 w-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <div>
                  <p className="text-xs font-medium text-neutral-700">{s.label}</p>
                  <p className="text-sm font-bold text-neutral-900">
                    {s.value}
                    <span className="text-xs text-neutral-400 font-normal ml-1">{pct}%</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-segment horizontal bars */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          {segments.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-20 text-xs text-neutral-500 text-right">{s.label}</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="w-8 text-xs text-neutral-600 font-medium">{s.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
