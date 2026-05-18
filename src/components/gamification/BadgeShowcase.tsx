"use client";

import { Trophy, Zap, Target, Clock, Star, Award, TrendingUp, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

const BADGE_ICONS: Record<string, React.ElementType> = {
  Trophy,
  Zap,
  Target,
  Clock,
  Star,
  Award,
  TrendingUp,
  CheckCircle,
};

const TIER_COLORS: Record<string, string> = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-gray-300 to-gray-500",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-indigo-300 to-purple-500",
};

const TIER_BG: Record<string, string> = {
  bronze: "bg-amber-50 border-amber-200",
  silver: "bg-gray-50 border-gray-200",
  gold: "bg-yellow-50 border-yellow-200",
  platinum: "bg-purple-50 border-purple-200",
};

interface BadgeCardProps {
  badge: UserBadge;
}

function BadgeCard({ badge }: BadgeCardProps) {
  const Icon = BADGE_ICONS[badge.icon] ?? Star;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
        badge.earned ? TIER_BG[badge.tier] : "bg-neutral-50 border-neutral-200 opacity-40",
        badge.earned && "hover:scale-105 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br text-white shadow-sm",
          badge.earned ? TIER_COLORS[badge.tier] : "from-neutral-300 to-neutral-400",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-center text-neutral-900 mt-1">
        {badge.name}
      </span>
      <span className="text-[10px] text-neutral-500 text-center leading-tight">
        {badge.description}
      </span>
      {badge.earned && badge.earnedAt && (
        <span className="text-[9px] text-neutral-400 mt-0.5">
          {new Date(badge.earnedAt).toLocaleDateString()}
        </span>
      )}
      {!badge.earned && (
        <span className="text-[9px] text-neutral-400 mt-0.5">Locked</span>
      )}
    </div>
  );
}

interface BadgeShowcaseProps {
  badges: UserBadge[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-brand-amber" />
          Achievements
          <span className="ml-auto text-xs font-normal text-neutral-500">
            {earned.length}/{badges.length} earned
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {earned.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
          {locked.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
