"use client";

import type { ReactNode } from "react";

export function MainContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
      {children}
    </div>
  );
}
