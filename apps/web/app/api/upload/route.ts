import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "../../../lib/r2";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Provjeri autentikaciju
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData  = await req.formData();
    const file      = formData.get("file") as File | null;
    const folder    = (formData.get("folder") as string) || user.id;
    const filename  = ((formData.get("filename") as string) || file?.name) ?? "file";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Fajl je prevelik (max 50MB)" }, { status: 400 });
    }

    const ext    = filename.split(".").pop()?.toLowerCase() ?? "bin";
    const path   = `${folder}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2(path, buffer, file.type);
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[upload]", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
