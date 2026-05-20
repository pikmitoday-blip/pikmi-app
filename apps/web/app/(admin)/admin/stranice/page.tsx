"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  created_at: string;
}

const BUILTIN_PAGES = [
  { title: "Landing page",        path: "/",           editable: false },
  { title: "Uslovi korišćenja",   path: "/uslovi",     editable: true,  editPath: "/admin/landing" },
  { title: "Politika privatnosti",path: "/privatnost", editable: true,  editPath: "/admin/landing" },
  { title: "Login",               path: "/login",      editable: false },
  { title: "Registracija",        path: "/register",   editable: false },
];

export default function AdminStranice() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editPage, setEditPage] = useState<CustomPage | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", is_published: true });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { loadPages(); }, []);

  async function loadPages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { setDbError(true); setLoading(false); return; }
      setPages(data ?? []);
    } catch { setDbError(true); }
    setLoading(false);
  }

  function openNew() {
    setEditPage(null);
    setForm({ title: "", slug: "", content: "", is_published: true });
    setShowForm(true);
  }

  function openEdit(p: CustomPage) {
    setEditPage(p);
    setForm({ title: p.title, slug: p.slug, content: p.content, is_published: p.is_published });
    setShowForm(true);
  }

  async function savePage() {
    if (!form.title.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      const slug = form.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      if (editPage) {
        const { error } = await supabase.from("custom_pages").update({ ...form, slug }).eq("id", editPage.id);
        if (error) throw error;
        setPages(prev => prev.map(p => p.id === editPage.id ? { ...p, ...form, slug } : p));
        showToast("Stranica ažurirana", true);
      } else {
        const { data, error } = await supabase.from("custom_pages").insert({ ...form, slug }).select().single();
        if (error) throw error;
        setPages(prev => [data, ...prev]);
        showToast("Stranica kreirana", true);
      }
      setShowForm(false);
    } catch {
      showToast("Greška pri čuvanju", false);
    }
    setSaving(false);
  }

  async function togglePublish(page: CustomPage) {
    const newVal = !page.is_published;
    await supabase.from("custom_pages").update({ is_published: newVal }).eq("id", page.id);
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: newVal } : p));
    showToast(newVal ? "Stranica objavljena" : "Stranica sakrivena", true);
  }

  async function deletePage(page: CustomPage) {
    if (!confirm(`Obrisati stranicu "${page.title}"?`)) return;
    await supabase.from("custom_pages").delete().eq("id", page.id);
    setPages(prev => prev.filter(p => p.id !== page.id));
    showToast("Stranica obrisana", true);
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  const cardStyle = {
    background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
    padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          padding: "12px 20px", borderRadius: 10,
          background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${toast.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: toast.ok ? "#4ADE80" : "#F87171", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {toast.ok ? "✓" : "⚠"} {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Stranice</h1>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Pregled i upravljanje svim stranicama platforme</p>
        </div>
        <button onClick={openNew} style={{
          padding: "9px 18px", borderRadius: 8, cursor: "pointer",
          background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
        }}>
          + Nova stranica
        </button>
      </div>

      {/* Ugrađene stranice */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
          Sistemske stranice
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {BUILTIN_PAGES.map(p => (
            <div key={p.path} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#E5E7EB" }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: "#4B5563" }}>{p.path}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ADE80", fontWeight: 600 }}>
                  Aktivna
                </span>
                <a href={p.path} target="_blank" rel="noreferrer" style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#9CA3AF", textDecoration: "none",
                }}>
                  Pregled ↗
                </a>
                {(p as any).editPath && (
                  <Link href={(p as any).editPath} style={{
                    padding: "5px 10px", borderRadius: 6, fontSize: 11,
                    background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
                    color: "#A78BFA", textDecoration: "none",
                  }}>
                    Uredi
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DB greška */}
      {dbError && (
        <div style={{
          padding: "16px 20px", borderRadius: 10, marginBottom: 20,
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
          color: "#FCD34D", fontSize: 13,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ Tabela custom_pages ne postoji</div>
          <pre style={{
            marginTop: 8, padding: "12px 14px", borderRadius: 8,
            background: "#0D0D12", color: "#A78BFA", fontSize: 11,
            overflowX: "auto", lineHeight: 1.6,
          }}>
{`CREATE TABLE custom_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published" ON custom_pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin write" ON custom_pages
  FOR ALL USING (true) WITH CHECK (true);`}
          </pre>
        </div>
      )}

      {/* Custom stranice */}
      {!dbError && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Prilagođene stranice ({pages.length})
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#4B5563", fontSize: 13 }}>Učitavanje...</div>
          ) : pages.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", background: "#111116", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
              <div style={{ fontSize: 13, color: "#4B5563" }}>Još nema prilagođenih stranica</div>
              <button onClick={openNew} style={{
                marginTop: 14, padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
                color: "#A78BFA", fontSize: 12, fontWeight: 600,
              }}>
                + Kreiraj prvu stranicu
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pages.map(p => (
                <div key={p.id} style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 16 }}>📝</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#E5E7EB" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#4B5563" }}>/{p.slug}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                      background: p.is_published ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${p.is_published ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                      color: p.is_published ? "#4ADE80" : "#4B5563",
                    }}>
                      {p.is_published ? "Aktivna" : "Skrivena"}
                    </span>
                    <button onClick={() => togglePublish(p)} style={{
                      padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                      color: "#6B7280",
                    }}>
                      {p.is_published ? "Sakrij" : "Objavi"}
                    </button>
                    <button onClick={() => openEdit(p)} style={{
                      padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11,
                      background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
                      color: "#A78BFA",
                    }}>
                      Uredi
                    </button>
                    <button onClick={() => deletePage(p)} style={{
                      padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11,
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                      color: "#F87171",
                    }}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal forma */}
      {showForm && (
        <div onClick={() => setShowForm(false)} style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#111116", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "28px", width: "100%", maxWidth: 540,
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F9FAFB", marginBottom: 20 }}>
              {editPage ? "Uredi stranicu" : "Nova stranica"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Naslov</label>
                <input value={form.title} onChange={e => {
                  const t = e.target.value;
                  setForm(p => ({ ...p, title: t, slug: editPage ? p.slug : slugify(t) }));
                }} style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  background: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F9FAFB", fontSize: 13, outline: "none", boxSizing: "border-box",
                }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>URL slug (npr. o-nama)</label>
                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: slugify(e.target.value) }))} style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  background: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F9FAFB", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "monospace",
                }} />
                {form.slug && <div style={{ marginTop: 4, fontSize: 11, color: "#4B5563" }}>pikmi.today/{form.slug}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Sadržaj (tekst)</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6} style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  background: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F9FAFB", fontSize: 13, outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit", resize: "vertical",
                }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" id="pub" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} />
                <label htmlFor="pub" style={{ fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Odmah objavi stranicu</label>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: "9px 18px", borderRadius: 8, cursor: "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#6B7280", fontSize: 13,
              }}>
                Otkaži
              </button>
              <button onClick={savePage} disabled={saving || !form.title || !form.slug} style={{
                padding: "9px 20px", borderRadius: 8, cursor: "pointer",
                background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                opacity: saving || !form.title || !form.slug ? 0.6 : 1,
              }}>
                {saving ? "Čuvanje..." : editPage ? "Sačuvaj izmjene" : "Kreiraj stranicu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
