import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MainContent } from "@/components/layout/MainContent";
import { WindowStatusBanner } from "@/components/layout/WindowStatusBanner";
import { getCurrentWindow } from "@/lib/utils/window";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth("manager");
  const windowStatus = await getCurrentWindow();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />
      <MainContent>
        <WindowStatusBanner windowStatus={windowStatus} />
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </MainContent>
    </div>
  );
}
