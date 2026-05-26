"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function uploadImage(file: File, folder: "cover" | "content"): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `blog/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("pikmi-uploads")
    .upload(filename, file, { contentType: file.type });
  if (error) { console.error("Upload error:", error); return null; }
  const { data: { publicUrl } } = supabase.storage.from("pikmi-uploads").getPublicUrl(filename);
  return publicUrl;
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function EditBlogPost() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "",
    seo_title: "", seo_description: "", cover_image: "",
  });
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [slugUserEdited, setSlugUserEdited] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    const { data, error: err } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (err || !data) {
      setError("Post nije pronađen.");
      setLoading(false);
      return;
    }
    setForm({
      title: data.title ?? "",
      slug: data.slug ?? "",
      content: data.content ?? "",
      excerpt: data.excerpt ?? "",
      seo_title: data.seo_title ?? "",
      seo_description: data.seo_description ?? "",
      cover_image: data.cover_image ?? "",
    });
    setPublished(data.published ?? false);
    setSlugUserEdited(true); // don't override existing slug
    setLoading(false);
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    const url = await uploadImage(file, "cover");
    if (url) set("cover_image", url);
    setUploadingCover(false);
  }

  async function handleInlineUpload(file: File) {
    setUploadingInline(true);
    const url = await uploadImage(file, "content");
    if (url) {
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const markdown = `\n![](${url})\n`;
        const newContent = form.content.slice(0, start) + markdown + form.content.slice(end);
        set("content", newContent);
        setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + markdown.length; ta.focus(); }, 50);
      } else {
        set("content", form.content + `\n![](${url})\n`);
      }
    }
    setUploadingInline(false);
  }

  function set(k: string, v: string) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "title" && !slugUserEdited) next.slug = generateSlug(v);
      return next;
    });
  }

  async function save() {
    if (!form.title || !form.slug) { setError("Naslov i slug su obavezni."); return; }
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("blog_posts").update({
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt,
      seo_title: form.seo_title || form.title,
      seo_description: form.seo_description || form.excerpt,
      cover_image: form.cover_image,
      published,
      published_at: published ? new Date().toISOString() : null,
    }).eq("id", id);
    if (err) {
      setError(err.code === "23505" ? "Slug već postoji. Promeni URL." : err.message);
      setSaving(false);
      return;
    }
    router.push("/admin/blog");
  }

  const charCountDesc = form.seo_description.length;

  if (loading) {
    return (
      <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>Učitavanje...</div>
    );
  }

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/blog" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>← Blog</Link>
          <span style={{ color: "#374151" }}>/</span>
          <span style={{ fontSize: 13, color: "#F9FAFB", fontWeight: 600 }}>Uredi post</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div
              onClick={() => setPublished(v => !v)}
              style={{
                width: 36, height: 20, borderRadius: 999,
                background: published ? "#7C3AED" : "rgba(255,255,255,0.1)",
                position: "relative", transition: "background 0.2s", cursor: "pointer",
              }}>
              <div style={{
                position: "absolute", top: 2, left: published ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>Objavljeno</span>
          </label>
          <a
            href={`/blog/${form.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "10px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#9CA3AF", fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}
          >
            ↗ Pregledaj
          </a>
          <button onClick={save} disabled={saving || !form.title || !form.slug} style={{
            padding: "10px 20px", borderRadius: 10,
            background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
            color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
            fontFamily: "inherit", opacity: (!form.title || !form.slug) ? 0.5 : 1,
          }}>
            {saving ? "Čuvanje..." : "Sačuvaj izmjene"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["content", "seo"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: activeTab === tab ? "#7C3AED" : "transparent",
            color: activeTab === tab ? "#fff" : "#6B7280",
            fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {tab === "content" ? "✍️ Sadržaj" : "🔍 SEO"}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Naslov */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Naslov posta *</label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Naslov posta..."
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                fontSize: 22, fontWeight: 700, color: "#F9FAFB", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Slug */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>URL (slug) *</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#4B5563", whiteSpace: "nowrap" }}>pikmi.today/blog/</span>
              <input
                value={form.slug}
                onChange={e => {
                  setSlugUserEdited(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
                }}
                placeholder="naziv-posta"
                style={{
                  flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6, padding: "6px 10px", color: "#A78BFA", fontSize: 13,
                  fontFamily: "monospace", outline: "none",
                }}
              />
            </div>
          </div>

          {/* Excerpt */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Kratki opis (excerpt)</label>
            <textarea
              value={form.excerpt}
              onChange={e => set("excerpt", e.target.value)}
              placeholder="Kratko objašnjenje o čemu je post..."
              rows={2}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none", resize: "none",
                fontSize: 14, color: "#D1D5DB", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box",
              }}
            />
          </div>

          {/* Sadržaj */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase" }}>Tekst posta</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#374151" }}>Markdown podržan</span>
                <label style={{ cursor: "pointer" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#A78BFA", cursor: "pointer" }}>
                    {uploadingInline ? "⏳" : "📷"} {uploadingInline ? "Uploading..." : "Umetni sliku"}
                  </span>
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingInline}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleInlineUpload(f); }} />
                </label>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={form.content}
              onChange={e => set("content", e.target.value)}
              placeholder={"# Uvod\n\nUpiši sadržaj posta ovdje...\n\n## Podnaslov\n\nNastavak teksta..."}
              rows={20}
              style={{
                width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8, padding: "14px", outline: "none", resize: "vertical",
                fontSize: 14, color: "#D1D5DB", fontFamily: "monospace", lineHeight: 1.7, boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      {activeTab === "seo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>SEO naslov</label>
            <input
              value={form.seo_title}
              onChange={e => set("seo_title", e.target.value)}
              placeholder={form.title || "SEO naslov stranice..."}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "10px 12px", color: "#F9FAFB", fontSize: 14,
                fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 11, color: "#374151", marginTop: 6 }}>Ostaviti prazno = koristit će se naslov posta</div>
          </div>

          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase" }}>Meta opis</label>
              <span style={{ fontSize: 11, color: charCountDesc > 160 ? "#F87171" : charCountDesc > 120 ? "#FBBF24" : "#4B5563" }}>
                {charCountDesc}/160
              </span>
            </div>
            <textarea
              value={form.seo_description}
              onChange={e => set("seo_description", e.target.value)}
              placeholder={form.excerpt || "Opis koji se prikazuje u Google rezultatima..."}
              rows={3}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "10px 12px", color: "#F9FAFB", fontSize: 14,
                fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 11, color: "#374151", marginTop: 6 }}>Idealno 120–160 karaktera</div>
          </div>

          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Cover slika</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <input value={form.cover_image} onChange={e => set("cover_image", e.target.value)}
                placeholder="https://... ili uploaduj ispod"
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 12px", color: "#F9FAFB", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <label style={{ cursor: "pointer", flexShrink: 0 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {uploadingCover ? "⏳ Uploading..." : "📷 Upload"}
                </span>
                <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingCover}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
              </label>
            </div>
            {form.cover_image && (
              <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden", maxHeight: 180 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.cover_image} alt="Cover preview" style={{ width: "100%", objectFit: "cover", maxHeight: 180 }} />
              </div>
            )}
          </div>

          {/* Google preview */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>Preview u Google rezultatima</div>
            <div style={{ background: "#1e1e1e", borderRadius: 8, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#4ADE80", marginBottom: 4 }}>pikmi.today › blog › {form.slug || "naziv-posta"}</div>
              <div style={{ fontSize: 16, color: "#60A5FA", fontWeight: 500, marginBottom: 4 }}>
                {form.seo_title || form.title || "Naslov posta"}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5 }}>
                {form.seo_description || form.excerpt || "Meta opis će se prikazati ovdje u Google rezultatima pretrage..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
