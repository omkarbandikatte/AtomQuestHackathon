/**
 * Centralised route definitions for all role-based navigation.
 */
export const ROUTES = {
  // Auth
  LOGIN: "/login",
  SIGNUP: "/signup",

  // Employee
  EMPLOYEE_DASHBOARD: "/home",
  GOAL_SHEET: "/goal-sheet",
  CHECKINS: "/checkins",
  PROGRESS: "/progress",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",

  // Manager
  MANAGER_DASHBOARD: "/team",
  TEAM: "/team",
  APPROVALS: "/approvals",
  MANAGER_CHECKINS: "/manager-checkins",
  SHARED_GOALS: "/shared-goals",
  TEAM_REPORTS: "/team-reports",

  // Admin
  ADMIN_DASHBOARD: "/dashboard",
  CYCLES: "/cycles",
  USERS: "/users",
  AUDIT_LOG: "/audit-log",
  REPORTS: "/reports",
  UNLOCK: "/unlock",
  ESCALATIONS: "/escalations",
  SETTINGS: "/settings",
} as const;

export const SIDEBAR_NAV = {
  employee: [
    { label: "Dashboard", href: ROUTES.EMPLOYEE_DASHBOARD, icon: "LayoutDashboard" },
    { label: "Goals", href: ROUTES.GOAL_SHEET, icon: "Target" },
    { label: "Quarterly Check-ins", href: ROUTES.CHECKINS, icon: "ClipboardCheck" },
    { label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: "Bell" },
    { label: "Profile", href: ROUTES.PROFILE, icon: "User" },
  ],
  manager: [
    { label: "Dashboard", href: ROUTES.MANAGER_DASHBOARD, icon: "LayoutDashboard" },
    { label: "Approvals", href: ROUTES.APPROVALS, icon: "CheckCircle" },
    { label: "Team Progress", href: ROUTES.MANAGER_CHECKINS, icon: "TrendingUp" },
    { label: "Shared Goals", href: ROUTES.SHARED_GOALS, icon: "Share2" },
    { label: "Reports", href: ROUTES.TEAM_REPORTS, icon: "BarChart3" },
  ],
  admin: [
    { label: "Dashboard", href: ROUTES.ADMIN_DASHBOARD, icon: "LayoutDashboard" },
    { label: "Users", href: ROUTES.USERS, icon: "Users" },
    { label: "Cycles", href: ROUTES.CYCLES, icon: "CalendarRange" },
    { label: "Reports", href: ROUTES.REPORTS, icon: "BarChart3" },
    { label: "Audit Logs", href: ROUTES.AUDIT_LOG, icon: "FileText" },
    { label: "Escalations", href: ROUTES.ESCALATIONS, icon: "AlertTriangle" },
    { label: "Settings", href: ROUTES.SETTINGS, icon: "Settings" },
  ],
} as const;

export const ERROR_CODES = {
  SHEET_LOCKED: "SHEET_LOCKED",
  WINDOW_CLOSED: "WINDOW_CLOSED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  MAX_GOALS_REACHED: "MAX_GOALS_REACHED",
  UNAUTHORISED: "UNAUTHORISED",
  NOT_FOUND: "NOT_FOUND",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
