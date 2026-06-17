import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const MAX_EXTRA = 2; // 1 primarni (profiles) + 2 dodatna (portfolios) = 3 ukupno

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function slugify(s: string): string {
  return (s || "portfolio").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "portfolio";
}

async function slugTaken(db: ReturnType<typeof admin>, slug: string): Promise<boolean> {
  const { data: a } = await db.from("profiles").select("id").eq("profile_url", slug).maybeSingle();
  if (a) return true;
  const { data: b } = await db.from("portfolios").select("id").eq("profile_url", slug).maybeSingle();
  return !!b;
}

export async function POST(req: NextRequest) {
  try {
    const { action, userId, id, label } = await req.json();
    if (!userId) return NextResponse.json({ error: "no-user" }, { status: 400 });
    const db = admin();

    const { data: prof } = await db
      .from("profiles")
      .select("plan, profile_url, first_name, last_name, profile_data")
      .eq("user_id", userId)
      .single();
    if (!prof) return NextResponse.json({ error: "no-profile" }, { status: 404 });

    // ── Brisanje / preimenovanje: dozvoljeno vlasniku (i ako je skinuo Pro) ──
    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "no-id" }, { status: 400 });
      await db.from("portfolios").delete().eq("id", id).eq("user_id", userId);
      return NextResponse.json({ ok: true });
    }

    if (action === "rename") {
      if (!id) return NextResponse.json({ error: "no-id" }, { status: 400 });
      const clean = (label && String(label).trim()) || "Portfolio";
      await db.from("portfolios").update({ label: clean.slice(0, 40) }).eq("id", id).eq("user_id", userId);
      return NextResponse.json({ ok: true, label: clean.slice(0, 40) });
    }

    // ── Kreiranje: samo Pro ──
    if ((prof as any).plan !== "pro") {
      return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    if (action === "create") {
      const { count } = await db
        .from("portfolios")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count ?? 0) >= MAX_EXTRA) {
        return NextResponse.json({ error: "limit" }, { status: 400 });
      }

      // Jedinstven slug: {primarni}-2, -3, ... (sa fallback sufiksom)
      const base = slugify((prof as any).profile_url || (prof as any).first_name || "portfolio");
      let n = (count ?? 0) + 2;
      let slug = `${base}-${n}`;
      let guard = 0;
      while (await slugTaken(db, slug) && guard < 30) { n++; guard++; slug = `${base}-${n}`; }
      if (await slugTaken(db, slug)) slug = `${base}-${Date.now().toString(36)}`;

      // Novi portfolio: ista osoba/izgled, ali prazne sekcije za novi tip klijenata.
      const basePd = ((prof as any).profile_data as Record<string, any>) || {};
      const pd = {
        ...basePd,
        serviceTitle: "", serviceDesc: "",
        pricing: [], stack: "",
        caseStudies: [{}, {}, {}, {}],
        csImages: ["", "", "", ""],
        experience: [], testimonials: [],
        ctaTitle: "", ctaHighlight: "",
        needsSetup: false,
      };

      const { data: row, error } = await db
        .from("portfolios")
        .insert({
          user_id: userId,
          profile_url: slug,
          first_name: (prof as any).first_name ?? "",
          last_name: (prof as any).last_name ?? "",
          label: (label && String(label).trim()) || `Portfolio ${n}`,
          profile_data: pd,
        })
        .select("id, profile_url, label, profile_data, first_name, last_name")
        .single();
      if (error) {
        console.error("[api/portfolio] insert error:", error);
        return NextResponse.json({ error: "insert-failed" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, portfolio: row });
    }

    return NextResponse.json({ error: "unknown-action" }, { status: 400 });
  } catch (err) {
    console.error("[api/portfolio] error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
