import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");

  // Kad Supabase vrati code na root stranicu — preusmjeri na auth/callback
  if (code && pathname === "/") {
    return NextResponse.redirect(`${origin}/auth/callback?code=${code}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
