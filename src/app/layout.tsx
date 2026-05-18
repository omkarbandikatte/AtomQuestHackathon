import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { getSessionProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "AtomQuest — Goal Tracking Portal",
  description: "Goal Setting & Tracking Portal for performance management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionProfile();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body bg-neutral-50 text-neutral-900 antialiased">
        <NavigationProgress />
        <QueryProvider>
          <AuthProvider initialUser={sessionUser}>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
