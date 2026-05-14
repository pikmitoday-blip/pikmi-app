import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Samo preusmjeravamo na client-side stranicu koja obrađuje token
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/reset-password";

  if (code) {
    // PKCE flow — proslijedi code na client stranicu
    return NextResponse.redirect(`${origin}/auth/confirm?code=${code}&next=${next}`);
  }

  // Implicit flow — hash fragment obrađuje client stranica
  return NextResponse.redirect(`${origin}/auth/confirm?next=${next}`);
}
