import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rute koje zahtevaju prijavu
const PROTECTED = ["/dashboard", "/moj-profil", "/profile-edit", "/pitch-link", "/outreach", "/billing"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Proveri da li je zaštićena ruta
  const isProtected = PROTECTED.some(route => pathname.startsWith(route));
  if (!isProtected) return response;

  // Kreiraj Supabase klijent za server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Ako nije ulogovan, redirect na login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/moj-profil/:path*", "/profile-edit/:path*", "/pitch-link/:path*", "/outreach/:path*", "/billing/:path*"],
};
