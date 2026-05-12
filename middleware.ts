import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DEMO_SESSION_COOKIE = "jobmada_demo_session";

function isDemoAuthEnabledInMiddleware() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (process.env.ENABLE_DEMO_AUTH === "false") {
    return false;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);
  const hasDemoSession = isDemoAuthEnabledInMiddleware() && cookieNames.includes(DEMO_SESSION_COOKIE);
  const hasSupabaseSession = cookieNames.some((name) => name.startsWith("sb-") && name.includes("auth-token"));

  if (!supabaseUrl || !supabaseAnonKey || !hasSupabaseSession) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
