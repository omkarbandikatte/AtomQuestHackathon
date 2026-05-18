import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Admin client with service_role key — bypasses RLS.
 * Use ONLY in Server Actions / API routes that need elevated access
 * (e.g., audit log writes, admin unlock, shared goal push).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
