"use client";

import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/use-ui-store";
import { useAuthStore } from "@/store/use-auth-store";
import { logoutAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Role } from "@/lib/constants/roles";

export function Header() {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-neutral-200 bg-surface-white px-4 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <span className="font-semibold text-brand-blue text-sm">
        Goal Setting &amp; Tracking Portal
      </span>

      <div className="ml-auto flex items-center gap-3 text-sm">
        {user && (
          <>
            <span className="text-neutral-500 hidden sm:block">
              {ROLE_LABELS[user.role as Role]}
            </span>
            <span className="font-medium text-neutral-900 truncate max-w-[120px]">
              {user.full_name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="text-neutral-500 hover:text-brand-red"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
