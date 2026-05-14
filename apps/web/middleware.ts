import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  // PKCE: kod na root putanji → auth/callback
  if (code && pathname === "/") {
    const next = type === "recovery" ? "/reset-password" : "/dashboard";
    return NextResponse.redirect(`${origin}/auth/callback?code=${code}&next=${next}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
