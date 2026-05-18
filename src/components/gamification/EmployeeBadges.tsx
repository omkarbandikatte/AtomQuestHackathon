"use client";

import { BadgeShowcase, type UserBadge } from "./BadgeShowcase";

interface EmployeeBadgesProps {
  hasGoals: boolean;
  sheetSubmitted: boolean;
  sheetApproved: boolean;
}

const ALL_BADGES: Omit<UserBadge, "earned" | "earnedAt">[] = [
  {
    id: "first_goal",
    name: "Goal Setter",
    description: "Created your first goal",
    icon: "Target",
    tier: "bronze",
  },
  {
    id: "early_submitter",
    name: "Early Bird",
    description: "Submitted before deadline",
    icon: "Clock",
    tier: "silver",
  },
  {
    id: "sheet_approved",
    name: "Goal Master",
    description: "Goal sheet approved",
    icon: "Trophy",
    tier: "gold",
  },
  {
    id: "consistent",
    name: "Consistent",
    description: "Check-ins on time",
    icon: "TrendingUp",
    tier: "silver",
  },
  {
    id: "high_scorer",
    name: "High Achiever",
    description: "Score above 90%",
    icon: "Star",
    tier: "platinum",
  },
  {
    id: "team_player",
    name: "Team Player",
    description: "Shared goal contributor",
    icon: "Award",
    tier: "bronze",
  },
];

export function EmployeeBadges({ hasGoals, sheetSubmitted, sheetApproved }: EmployeeBadgesProps) {
  const now = new Date().toISOString();
  const badges: UserBadge[] = ALL_BADGES.map((b) => {
    let earned = false;
    if (b.id === "first_goal" && hasGoals) earned = true;
    if (b.id === "early_submitter" && sheetSubmitted) earned = true;
    if (b.id === "sheet_approved" && sheetApproved) earned = true;
    return { ...b, earned, earnedAt: earned ? now : undefined };
  });

  return <BadgeShowcase badges={badges} />;
}
