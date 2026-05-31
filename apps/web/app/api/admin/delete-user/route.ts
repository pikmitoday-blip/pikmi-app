import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Obriši sve pitch linkove korisnika
    await supabaseAdmin.from("pitch_links").delete().eq("user_id", userId);

    // 2. Obriši sesije
    await supabaseAdmin.from("user_sessions").delete().eq("user_id", userId);

    // 3. Obriši profil
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    // 4. Obriši iz Supabase Auth (ovo je ključno — bez ovoga korisnik ostaje)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Auth delete error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
