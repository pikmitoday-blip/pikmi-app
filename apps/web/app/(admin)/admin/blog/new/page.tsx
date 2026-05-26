"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function NewBlogPost() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "",
    seo_title: "", seo_description: "", cover_image: "",
  });
  const [saving, setSaving] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");

  function set(k: string, v: string) {
    setForm(f => {
      const next = { ...f, [k]: v };
      // Auto-generiši slug iz naslova
      if (k === "title" && !f.slug) next.slug = generateSlug(v);
      return next;
    });
  }

  async function save() {
    if (!form.title || !form.slug) { setError("Naslov i slug su obavezni."); return; }
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("blog_posts").insert({
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt,
      seo_title: form.seo_title || form.title,
      seo_description: form.seo_description || form.excerpt,
      cover_image: form.cover_image,
      published: publishNow,
      published_at: publishNow ? new Date().toISOString() : null,
    });
    if (err) {
      setError(err.code === "23505" ? "Slug već postoji. Promeni URL." : err.message);
      setSaving(false);
      return;
    }
    router.push("/admin/blog");
  }

  const charCountDesc = form.seo_description.length;

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/blog" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>← Blog</Link>
          <span style={{ color: "#374151" }}>/</span>
          <span style={{ fontSize: 13, color: "#F9FAFB", fontWeight: 600 }}>Novi post</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div
              onClick={() => setPublishNow(v => !v)}
              style={{
                width: 36, height: 20, borderRadius: 999,
                background: publishNow ? "#7C3AED" : "rgba(255,255,255,0.1)",
                position: "relative", transition: "background 0.2s", cursor: "pointer",
              }}>
              <div style={{
                position: "absolute", top: 2, left: publishNow ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>Objavi odmah</span>
          </label>
          <button onClick={save} disabled={saving || !form.title || !form.slug} style={{
            padding: "10px 20px", borderRadius: 10,
            background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
            color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
            fontFamily: "inherit", opacity: (!form.title || !form.slug) ? 0.5 : 1,
          }}>
            {saving ? "Čuvanje..." : publishNow ? "Sačuvaj i objavi" : "Sačuvaj kao draft"}
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
              placeholder="Kako freelanceri osvajaju klijente u 2025..."
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
                onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
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
              placeholder="Kratko objašnjenje o čemu je post (prikazuje se u listingu)..."
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
              <span style={{ fontSize: 11, color: "#374151" }}>Markdown podržan</span>
            </div>
            <textarea
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
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Cover slika (URL)</label>
            <input
              value={form.cover_image}
              onChange={e => set("cover_image", e.target.value)}
              placeholder="https://..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "10px 12px", color: "#F9FAFB", fontSize: 14,
                fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }}
            />
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
