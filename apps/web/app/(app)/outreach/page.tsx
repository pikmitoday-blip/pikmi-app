"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

interface DocSection {
  title: string;
  desc: string;
  icon: string;
  url: string;
  preview: string;
}

const DEFAULTS: DocSection[] = [
  { title: "Cold DM & Email Šabloni",       desc: "Gotovi šabloni za hladni kontakt sa potencijalnim klijentima.",   icon: "✉️", url: "", preview: "" },
  { title: "Follow-up & Upsell Strategija", desc: "Kako pratiti klijente i povećati vrednost narudžbine.",            icon: "📈", url: "", preview: "" },
  { title: "Ponuda & Pozicioniranje",        desc: "Kako napraviti neodoljivu ponudu i pozicionirati se kao ekspert.", icon: "🎯", url: "", preview: "" },
  { title: "Klijentski Onboarding Kit",      desc: "Sve što trebaš za profesionalan onboarding novog klijenta.",      icon: "🤝", url: "", preview: "" },
];

export default function Outreach() {
  const [plan, setPlan] = useState<"loading" | "free" | "pro">("loading");
  const [docs, setDocs] = useState<DocSection[]>(DEFAULTS);
  const [openDoc, setOpenDoc] = useState<DocSection | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!user) { setPlan("free"); return; }

        const [profileRes, settingsRes] = await Promise.all([
          supabase.from("profiles").select("plan").eq("user_id", user.id).single(),
          supabase.from("platform_settings").select("key, value").like("key", "outreach_doc_%"),
        ]);

        setPlan(profileRes.data?.plan === "pro" ? "pro" : "free");

        if (settingsRes.data && settingsRes.data.length > 0) {
          const map: Record<string, string> = {};
          settingsRes.data.forEach(r => { map[r.key] = r.value; });
          setDocs(prev => prev.map((d, i) => ({
            title:   map[`outreach_doc_${i + 1}_title`]   ?? d.title,
            desc:    map[`outreach_doc_${i + 1}_desc`]    ?? d.desc,
            icon:    map[`outreach_doc_${i + 1}_icon`]    ?? d.icon,
            url:     map[`outreach_doc_${i + 1}_url`]     ?? d.url,
            preview: map[`outreach_doc_${i + 1}_preview`] ?? d.preview,
          })));
        }
      } catch { setPlan("free"); }
    }
    load();
  }, []);

  const isPro = plan === "pro";

  function getFileType(url: string): "pdf" | "image" | "office" | "other" {
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext)) return "office";
    return "other";
  }

  function getViewerUrl(url: string): string {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Outreach Kit</h1>
          <p className="page-subtitle">
            {isPro ? "Klikni na dokument da ga pročitaš." : "Pretplati se na Pro da otključaš sve dokumente."}
          </p>
        </div>
      </div>

      {/* Free plan banner */}
      {plan === "free" && (
        <div style={{
          padding: "14px 18px", borderRadius: 12, marginBottom: 24,
          background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)",
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>🔒 Dokumenti zaključani</div>
            <div style={{ fontSize: 13, color: "var(--text3)" }}>Pro plan otključava sve 4 sekcije Outreach Kita.</div>
          </div>
          <Link href="/account?tab=subscription" className="btn btn-primary btn-sm">
            ⚡ Postani Pro
          </Link>
        </div>
      )}

      {/* 4 document cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="outreach-grid">
        <style>{`@media(max-width:640px){.outreach-grid{grid-template-columns:1fr!important}}`}</style>

        {docs.map((doc, i) => {
          const isFirst = i === 0;
          const locked = !isPro;
          const hasFile = !!doc.url;
          const hasPreview = !!doc.preview.trim();

          return (
            <div
              key={i}
              onClick={() => { if (!locked && hasFile) setOpenDoc({ ...doc }); }}
              style={{
                background: "rgba(139,92,246,0.04)",
                border: `1px solid rgba(139,92,246,0.12)`,
                borderRadius: 18, overflow: "hidden",
                cursor: (!locked && hasFile) ? "pointer" : "default",
                transition: "border-color 0.2s",
              }}
            >
              {/* Card header */}
              <div style={{ padding: "18px 18px 14px" }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{doc.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{doc.title}</h3>
                <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5, margin: 0 }}>{doc.desc}</p>
              </div>

              {/* Document preview area — fiksna visina */}
              <div style={{ margin: "0 14px 14px", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)", position: "relative", height: 200 }}>

                <div style={{ padding: "14px 16px 0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                    {doc.title}
                  </div>
                </div>

                {locked ? (
                  isFirst ? (
                    // PRVI dokument: tekst vidljiv, donja POLOVINA KONTEJNERA (50% od 200px) blurirana
                    <>
                      {/* Sav tekst — ne seče se */}
                      <div style={{ padding: "0 16px 14px", fontSize: 12, color: "var(--text2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {hasPreview
                          ? doc.preview
                          : <>{[85, 70, 90, 65, 80, 55, 75, 60].map((w, j) => <div key={j} style={{ height: 8, borderRadius: 4, background: "var(--border)", width: `${w}%`, marginBottom: 8 }} />)}</>
                        }
                      </div>
                      {/* Blur overlay — tačno donja polovina 200px kontejnera */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                        background: "linear-gradient(180deg, transparent 0%, rgba(var(--surface-rgb,17,17,22),0.7) 100%)",
                        pointerEvents: "none",
                      }} />
                      {/* Lock — centriran na celoj sekciji */}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
                        <span style={{ fontSize: 34 }}>🔒</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>Zaključano · Pro plan</span>
                      </div>
                    </>
                  ) : (
                    // OSTALI dokumenti: skroz blurirani + lock centriran
                    <>
                      <div style={{ padding: "0 16px 14px", filter: "blur(6px)", userSelect: "none", pointerEvents: "none" }}>
                        {hasPreview
                          ? <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{doc.preview}</div>
                          : <>{[85, 70, 90, 65, 80, 55, 75, 60, 88].map((w, j) => <div key={j} style={{ height: 8, borderRadius: 4, background: "var(--border)", width: `${w}%`, marginBottom: 8 }} />)}</>
                        }
                      </div>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
                        <span style={{ fontSize: 34 }}>🔒</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>Zaključano · Pro plan</span>
                      </div>
                    </>
                  )
                ) : (
                  // PRO — pun prikaz preview teksta
                  <div style={{ padding: "0 16px 14px", fontSize: 12, color: "var(--text2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {hasPreview
                      ? doc.preview
                      : <>{[85, 70, 90, 65, 80, 55, 75, 60, 88].map((w, j) => <div key={j} style={{ height: 8, borderRadius: 4, background: "var(--border)", width: `${w}%`, marginBottom: 8 }} />)}</>
                    }
                    {!hasFile && <div style={{ marginTop: 10, fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>Dokument dolazi uskoro</div>}
                  </div>
                )}

                {/* Pro: "klikni da čitaš" hint */}
                {!locked && hasFile && (
                  <div style={{ padding: "0 16px 10px", display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#A78BFA", background: "rgba(124,58,237,0.1)", padding: "3px 10px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.2)" }}>
                      Klikni da čitaš ↗
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "0 18px 14px" }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                  background: locked ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                  border: `1px solid ${locked ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                  color: locked ? "#F87171" : "#4ADE80",
                }}>
                  {locked ? "🔒 Zaključano" : "✓ Dostupno"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document viewer modal — NO download button */}
      {openDoc && (
        <div
          onClick={() => setOpenDoc(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--surface)", borderRadius: 20,
              width: "100%", maxWidth: 800, maxHeight: "90vh",
              display: "flex", flexDirection: "column",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Modal header — no download */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{openDoc.icon}</span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{openDoc.title}</h2>
                  <p style={{ fontSize: 12, color: "var(--text3)", margin: 0, marginTop: 2 }}>{openDoc.desc}</p>
                </div>
              </div>
              <button onClick={() => setOpenDoc(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 18, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ×
              </button>
            </div>

            {/* Document content — key na URL forsira reinicijalizaciju kad se promeni dokument */}
            <div key={openDoc.url} style={{ flex: 1, overflow: "hidden", borderRadius: "0 0 20px 20px", position: "relative" }}>
              {getFileType(openDoc.url) === "pdf" ? (
                <iframe
                  key={`pdf-${openDoc.url}`}
                  src={`${openDoc.url}#toolbar=0&navpanes=0&scrollbar=1`}
                  style={{ width: "100%", height: "100%", minHeight: "70vh", border: "none", display: "block" }}
                  title={openDoc.title}
                  loading="eager"
                />
              ) : getFileType(openDoc.url) === "image" ? (
                <div style={{ padding: 24, overflowY: "auto", maxHeight: "70vh" }}>
                  <img src={openDoc.url} alt={openDoc.title} style={{ width: "100%", borderRadius: 12 }} />
                </div>
              ) : getFileType(openDoc.url) === "office" ? (
                // Word/Excel/PPT — Google Docs Viewer
                <iframe
                  key={`office-${openDoc.url}`}
                  src={getViewerUrl(openDoc.url)}
                  style={{ width: "100%", height: "100%", minHeight: "70vh", border: "none", display: "block" }}
                  title={openDoc.title}
                  loading="eager"
                />
              ) : (
                // Nepoznat tip — direktan link
                <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 48 }}>📄</span>
                  <a href={openDoc.url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                    Otvori dokument ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
