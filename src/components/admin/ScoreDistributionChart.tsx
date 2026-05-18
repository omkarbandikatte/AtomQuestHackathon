import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Bucket {
  label: string;
  count: number;
}

interface Props {
  distribution: Bucket[];
}

const BUCKET_COLORS = [
  "bg-brand-red/70",
  "bg-brand-amber/70",
  "bg-yellow-400/70",
  "bg-brand-teal/60",
  "bg-brand-green/70",
];

export function ScoreDistributionChart({ distribution }: Props) {
  const max = Math.max(...distribution.map((b) => b.count), 1);
  const total = distribution.reduce((s, b) => s + b.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Score Distribution</CardTitle>
        <p className="text-xs text-neutral-400">{total} check-in scores across all goals</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">No check-in data yet</p>
        ) : (
          <div className="space-y-3">
            {distribution.map((bucket, i) => {
              const pct = max > 0 ? (bucket.count / max) * 100 : 0;
              const sharePct = total > 0 ? Math.round((bucket.count / total) * 100) : 0;
              return (
                <div key={bucket.label} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-right text-neutral-500 flex-shrink-0">
                    {bucket.label}
                  </span>
                  <div className="flex-1 h-5 bg-neutral-100 rounded overflow-hidden">
                    <div
                      className={`h-5 rounded transition-all duration-700 ${BUCKET_COLORS[i]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-xs text-neutral-600 font-medium flex-shrink-0">
                    {bucket.count}
                    <span className="text-neutral-400 font-normal ml-1">({sharePct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
