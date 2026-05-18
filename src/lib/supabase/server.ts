import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types/database.types";

type CookieOptions = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Creates a Supabase client for server components.
 * Wrapped in React cache() so it's created only once per request.
 */
export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieOptions[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any),
            );
          } catch {
            // The `setAll` method is called from a Server Component
            // where cookies can't be set. This can be ignored if
            // middleware refreshes user sessions.
          }
        },
      },
    },
  );
});
