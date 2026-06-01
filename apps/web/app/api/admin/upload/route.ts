import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "../../../../lib/r2";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const folder   = (formData.get("folder") as string) || "uploads";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const ext    = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path   = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2(path, buffer, file.type);
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[admin/upload]", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
