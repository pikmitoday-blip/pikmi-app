"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";

interface DocSection {
  title: string;
  desc: string;
  icon: string;
  url: string;
}

const DEFAULTS: DocSection[] = [
  { title: "Cold DM & Email Šabloni",      desc: "Gotovi šabloni za hladni kontakt sa potencijalnim klijentima.",    icon: "✉️", url: "" },
  { title: "Follow-up & Upsell Strategija", desc: "Kako pratiti klijente i povećati vrednost narudžbine.",             icon: "📈", url: "" },
  { title: "Ponuda & Pozicioniranje",       desc: "Kako napraviti neodoljivu ponudu i pozicionirati se kao ekspert.",  icon: "🎯", url: "" },
  { title: "Klijentski Onboarding Kit",     desc: "Sve što trebaš za profesionalan onboarding novog klijenta.",       icon: "🤝", url: "" },
];

export default function AdminOutreach() {
  const [docs, setDocs] = useState<DocSection[]>(DEFAULTS);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .like("key", "outreach_doc_%");
      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setDocs(prev => prev.map((d, i) => ({
          title: map[`outreach_doc_${i + 1}_title`] ?? d.title,
          desc:  map[`outreach_doc_${i + 1}_desc`]  ?? d.desc,
          icon:  map[`outreach_doc_${i + 1}_icon`]  ?? d.icon,
          url:   map[`outreach_doc_${i + 1}_url`]   ?? d.url,
        })));
      }
    } catch {}
    setLoading(false);
  }

  async function uploadFile(i: number, file: File) {
    setUploading(i);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "outreach");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || data.error) {
        alert("Greška pri uploadu: " + (data.error ?? "Nepoznata greška"));
        return;
      }
      setDocs(prev => prev.map((d, j) => j === i ? { ...d, url: data.url } : d));
    } catch (e: any) {
      alert("Greška: " + e.message);
    }
    setUploading(null);
  }

  async function saveDocs() {
    setSaving(true);
    try {
      const rows = docs.flatMap((d, i) => [
        { key: `outreach_doc_${i + 1}_title`, value: d.title, updated_at: new Date().toISOString() },
        { key: `outreach_doc_${i + 1}_desc`,  value: d.desc,  updated_at: new Date().toISOString() },
        { key: `outreach_doc_${i + 1}_icon`,  value: d.icon,  updated_at: new Date().toISOString() },
        { key: `outreach_doc_${i + 1}_url`,   value: d.url,   updated_at: new Date().toISOString() },
      ]);
      const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Greška pri čuvanju.");
    }
    setSaving(false);
  }

  const INP: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    background: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)",
    color: "#F9FAFB", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Outreach Kit dokumenti</h1>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Uploaduj dokumente za 4 sekcije Outreach Kit stranice. Pro korisnici ih mogu čitati, Free korisnici vide zamućen pregled.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#4ADE80", fontWeight: 600 }}>✓ Sačuvano!</span>}
          <button onClick={saveDocs} disabled={saving || loading} style={{
            padding: "9px 20px", borderRadius: 8, cursor: "pointer",
            background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Čuvanje..." : "Sačuvaj sve"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#4B5563" }}>Učitavanje...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {docs.map((doc, i) => (
            <div key={i} style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{doc.icon}</span>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB", margin: 0 }}>Sekcija {i + 1}</h2>
                {doc.url && <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ADE80" }}>✓ Dokument uploadovan</span>}
              </div>
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Ikona</label>
                    <input value={doc.icon} onChange={e => setDocs(prev => prev.map((d, j) => j === i ? { ...d, icon: e.target.value } : d))} style={{ ...INP, textAlign: "center", fontSize: 20 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Naslov sekcije</label>
                    <input value={doc.title} onChange={e => setDocs(prev => prev.map((d, j) => j === i ? { ...d, title: e.target.value } : d))} style={INP} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Opis</label>
                  <input value={doc.desc} onChange={e => setDocs(prev => prev.map((d, j) => j === i ? { ...d, desc: e.target.value } : d))} style={INP} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Dokument (PDF, Word, slika)</label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ cursor: "pointer" }}>
                      <div style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        {uploading === i ? "⏳ Otpremam..." : "📁 Upload dokumenta"}
                      </div>
                      <input type="file" accept=".pdf,.doc,.docx,.txt,image/*" style={{ display: "none" }} disabled={uploading !== null}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(i, f); e.target.value = ""; }} />
                    </label>
                    {doc.url && (
                      <>
                        <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>
                          Pregled ↗
                        </a>
                        <button onClick={() => setDocs(prev => prev.map((d, j) => j === i ? { ...d, url: "" } : d))}
                          style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>
                          Ukloni
                        </button>
                      </>
                    )}
                  </div>
                  {doc.url && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#4B5563", wordBreak: "break-all" }}>
                      URL: {doc.url.split("/").pop()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
