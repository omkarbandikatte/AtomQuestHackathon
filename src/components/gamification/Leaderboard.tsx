"use client";

import { Trophy, Medal, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  department: string;
  score: number;
  badge?: string;
}

interface LeaderboardProps {
  title: string;
  entries: LeaderboardEntry[];
  metric?: string;
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-yellow-50 border-yellow-300",
  2: "bg-gray-50 border-gray-300",
  3: "bg-amber-50 border-amber-300",
};

const RANK_ICONS: Record<number, React.ReactNode> = {
  1: <Trophy className="h-4 w-4 text-yellow-600" />,
  2: <Medal className="h-4 w-4 text-gray-500" />,
  3: <Medal className="h-4 w-4 text-amber-600" />,
};

export function Leaderboard({ title, entries, metric = "%" }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-teal" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-neutral-50",
                RANK_STYLES[entry.rank] && `${RANK_STYLES[entry.rank]} border-l-2`,
              )}
            >
              <div className="flex items-center justify-center w-6">
                {RANK_ICONS[entry.rank] ?? (
                  <span className="text-xs font-bold text-neutral-400">#{entry.rank}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{entry.name}</p>
                <p className="text-xs text-neutral-500">{entry.department}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-brand-blue">{entry.score}{metric}</span>
              </div>
              {entry.badge && (
                <span className="text-xs">{entry.badge}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
