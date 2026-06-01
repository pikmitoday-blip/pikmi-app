import { supabase } from "./supabase";

/**
 * Uploaduj fajl direktno na R2 koristeći presigned URL.
 * Browser → R2 direktno, zaobilazi Vercel body-size limit (4.5 MB).
 * Radi za slike, videe, PDF-ove i bilo koji drugi tip fajla.
 */
export async function uploadFile(
  file: File,
  options?: { folder?: string; filename?: string }
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Nisi ulogovan");

  const filename = options?.filename ?? file.name;

  // 1. Zatraži presigned URL od servera
  const presignRes = await fetch("/api/upload/presign", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      contentType: file.type || "application/octet-stream",
      folder:      options?.folder,
    }),
  });

  const presignData = await presignRes.json();
  if (!presignRes.ok) throw new Error(presignData.error ?? "Presign failed");

  const { uploadUrl, publicUrl } = presignData as { uploadUrl: string; publicUrl: string };

  // 2. Uploaduj direktno na R2 (PUT) — nema Vercel limit
  const putRes = await fetch(uploadUrl, {
    method:  "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body:    file,
  });

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "");
    throw new Error(`R2 upload greška ${putRes.status}: ${text}`);
  }

  return publicUrl;
}
