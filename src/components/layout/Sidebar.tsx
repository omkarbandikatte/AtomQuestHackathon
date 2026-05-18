"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { SIDEBAR_NAV } from "@/lib/constants/routes";
import { useAuthStore } from "@/store/use-auth-store";
import { useUIStore } from "@/store/use-ui-store";
import { logoutAction } from "@/app/actions/auth";
import {
  Target,
  ClipboardCheck,
  TrendingUp,
  Users,
  CheckCircle,
  MessageSquare,
  Settings,
  Building,
  FileText,
  BarChart3,
  LayoutDashboard,
  LockOpen,
  X,
  LogOut,
  Bell,
  User,
  Share2,
  AlertTriangle,
  CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/constants/roles";

const ICON_MAP: Record<string, React.ElementType> = {
  Target,
  ClipboardCheck,
  TrendingUp,
  Users,
  CheckCircle,
  MessageSquare,
  Settings,
  Building,
  FileText,
  BarChart3,
  LayoutDashboard,
  LockOpen,
  Bell,
  User,
  Share2,
  AlertTriangle,
  CalendarRange,
};

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeSidebar);
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const role = user?.role as Role | undefined;
  const navItems = role ? SIDEBAR_NAV[role] ?? [] : [];

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-blue text-white transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo + close button */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-white/10">
          <span className="text-brand-teal font-bold text-2xl">⚛</span>
          <span className="font-bold text-sm tracking-wide flex-1">AtomQuest</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Target;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  closeSidebar();
                  if (!isActive) {
                    e.preventDefault();
                    startTransition(() => {
                      router.push(item.href);
                    });
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                  isPending && !isActive && "opacity-60",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-white/10 p-4">
          {user && (
            <div className="mb-3 px-1">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-brand-teal capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
