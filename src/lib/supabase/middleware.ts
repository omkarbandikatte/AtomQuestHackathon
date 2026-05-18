import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/constants/roles";
import type { Database } from "@/types/database.types";

type CookieOptions = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Route-to-role mapping. Paths under these prefixes require the specified roles.
 * If a user's role doesn't match, they get redirected to their default route.
 */
const ROLE_ROUTE_MAP: { prefix: string; allowedRoles: Role[] }[] = [
  { prefix: "/goal-sheet", allowedRoles: ["employee"] },
  { prefix: "/checkins", allowedRoles: ["employee"] },
  { prefix: "/progress", allowedRoles: ["employee"] },
  { prefix: "/team", allowedRoles: ["manager"] },
  { prefix: "/approvals", allowedRoles: ["manager"] },
  { prefix: "/manager-checkins", allowedRoles: ["manager"] },
  { prefix: "/dashboard", allowedRoles: ["admin"] },
  { prefix: "/cycles", allowedRoles: ["admin"] },
  { prefix: "/users", allowedRoles: ["admin"] },
  { prefix: "/audit-log", allowedRoles: ["admin"] },
  { prefix: "/reports", allowedRoles: ["admin"] },
  { prefix: "/unlock", allowedRoles: ["admin"] },
];

/** Returns the default landing page for a given role */
function getDefaultRoute(role: Role): string {
  switch (role) {
    case "admin":
      return "/dashboard";
    case "manager":
      return "/team";
    default:
      return "/goal-sheet";
  }
}

/** Public paths that don't require authentication */
const PUBLIC_PATHS = ["/login", "/signup", "/auth"];

/** Service-role client — bypasses RLS for internal profile lookups in middleware */
function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieOptions[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any),
          );
        },
      },
    },
  );

  // Always refresh the session token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow public paths without auth
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublicPath) {
    // Unauthenticated user trying to access protected route → redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    // Authenticated user on login page → redirect to their default route
    const { data: profile } = await createServiceClient()
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // No profile row means this auth account has no app access yet.
    // Stay on the login page to avoid a redirect loop.
    if (!profile) return supabaseResponse;

    const role = profile.role as Role;
    const url = request.nextUrl.clone();
    url.pathname = getDefaultRoute(role);
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  if (user && !isPublicPath) {
    const routeRule = ROLE_ROUTE_MAP.find((r) => pathname.startsWith(r.prefix));

    if (routeRule) {
      const { data: profile } = await createServiceClient()
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      // No profile → treat as unauthenticated for protected routes
      if (!profile) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(url);
      }

      const role = profile.role as Role;

      if (!routeRule.allowedRoles.includes(role)) {
        // User doesn't have permission for this route → redirect to their default
        const url = request.nextUrl.clone();
        url.pathname = getDefaultRoute(role);
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
