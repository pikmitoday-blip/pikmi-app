import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../../../../lib/r2";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BUCKET     = process.env.R2_BUCKET_NAME ?? "pikmi-uploads";
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { filename, contentType, folder } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
    }

    const ext  = filename.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${folder ?? user.id}/${Date.now()}.${ext}`;

    // Generiši presigned URL — važi 5 minuta
    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: BUCKET, Key: path, ContentType: contentType }),
      { expiresIn: 300 }
    );

    return NextResponse.json({
      uploadUrl: signedUrl,
      publicUrl: `${PUBLIC_URL}/${path}`,
    });
  } catch (err: any) {
    console.error("[presign]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
