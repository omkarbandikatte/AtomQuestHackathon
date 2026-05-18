import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo");

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  // Collect cookies that Supabase wants to set during code exchange.
  // We'll attach them to the final redirect response so the browser
  // actually receives the session cookies.
  type CookieSetter = {
    name: string;
    value: string;
    options: Parameters<ReturnType<typeof NextResponse.redirect>["cookies"]["set"]>[2];
  };
  const pendingCookies: CookieSetter[] = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Also mutate request cookies so subsequent calls on this same
            // client instance (e.g. getUser) can read the new session.
            request.cookies.set(name, value);
            pendingCookies.push({ name, value, options });
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  // Determine where to send the user after login.
  let destination = "/goal-sheet"; // safe default

  if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    destination = redirectTo;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        switch (profile.role) {
          case "admin":
            destination = "/cycles";
            break;
          case "manager":
            destination = "/team";
            break;
          default:
            destination = "/goal-sheet";
        }
      }
    }
  }

  // Build the redirect response and attach the session cookies to it.
  const response = NextResponse.redirect(new URL(destination, requestUrl.origin));
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
