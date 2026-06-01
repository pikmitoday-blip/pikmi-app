import { supabase } from "./supabase";

/**
 * Uploaduj fajl na R2 kroz /api/upload rutu.
 * Automatski dobavlja Supabase session token za autentikaciju.
 */
export async function uploadFile(
  file: File,
  options?: { folder?: string; filename?: string }
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Nisi ulogovan");

  const formData = new FormData();
  formData.append("file", file);
  if (options?.folder)   formData.append("folder",   options.folder);
  if (options?.filename) formData.append("filename", options.filename);

  const res = await fetch("/api/upload", {
    method:  "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body:    formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url;
}
