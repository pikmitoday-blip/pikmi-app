import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    return NextResponse.redirect(`${origin}/auth/confirm?code=${code}`);
  }

  // Implicit flow — hash fragment (#access_token=...) obrađuje client stranica
  return NextResponse.redirect(`${origin}/auth/confirm`);
}
