"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

interface DocSection {
  title: string;
  desc: string;
  icon: string;
  url: string;
}

const DEFAULTS: DocSection[] = [
  { title: "Cold DM & Email Šabloni",       desc: "Gotovi šabloni za hladni kontakt sa potencijalnim klijentima.",   icon: "✉️", url: "" },
  { title: "Follow-up & Upsell Strategija", desc: "Kako pratiti klijente i povećati vrednost narudžbine.",            icon: "📈", url: "" },
  { title: "Ponuda & Pozicioniranje",        desc: "Kako napraviti neodoljivu ponudu i pozicionirati se kao ekspert.", icon: "🎯", url: "" },
  { title: "Klijentski Onboarding Kit",      desc: "Sve što trebaš za profesionalan onboarding novog klijenta.",      icon: "🤝", url: "" },
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
            title: map[`outreach_doc_${i + 1}_title`] ?? d.title,
            desc:  map[`outreach_doc_${i + 1}_desc`]  ?? d.desc,
            icon:  map[`outreach_doc_${i + 1}_icon`]  ?? d.icon,
            url:   map[`outreach_doc_${i + 1}_url`]   ?? d.url,
          })));
        }
      } catch { setPlan("free"); }
    }
    load();
  }, []);

  const isPro = plan === "pro";

  function getFileType(url: string): "pdf" | "image" | "other" {
    const ext = url.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    return "other";
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Outreach Kit</h1>
          <p className="page-subtitle">
            {isPro ? "Klikni na dokument da ga otvoriš i pročitaš." : "Pretplati se na Pro da otključaš sve dokumente."}
          </p>
        </div>
        {!isPro && plan !== "loading" && (
          <Link href="/account?tab=subscription" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            ⚡ Otključaj sve
          </Link>
        )}
      </div>

      {/* Plan banner for free users */}
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

          return (
            <div
              key={i}
              onClick={() => {
                if (!locked && hasFile) setOpenDoc(doc);
              }}
              style={{
                background: "rgba(139,92,246,0.04)",
                border: `1px solid rgba(139,92,246,0.12)`,
                borderRadius: 18, overflow: "hidden",
                cursor: (!locked && hasFile) ? "pointer" : "default",
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {/* Card header */}
              <div style={{ padding: "20px 20px 16px" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{doc.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{doc.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.5, margin: 0 }}>{doc.desc}</p>
              </div>

              {/* Document preview */}
              <div style={{ margin: "0 16px 16px", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)", position: "relative", minHeight: 140 }}>

                {/* Placeholder preview text */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                    {doc.title}
                  </div>
                  {[85, 70, 90, 65, 80, 55, 75, 60, 88, 72].map((w, j) => (
                    <div key={j} style={{ height: 8, borderRadius: 4, background: "var(--border)", width: `${w}%`, marginBottom: 7 }} />
                  ))}
                </div>

                {/* Blur overlay — FIRST: only bottom half; others: full */}
                {locked && (
                  <>
                    {isFirst ? (
                      // First card: top half visible, bottom half blurred
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
                        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                        background: "rgba(var(--bg-rgb, 11,15,25), 0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexDirection: "column", gap: 6,
                      }}>
                        <span style={{ fontSize: 28 }}>🔒</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>Pro plan</span>
                      </div>
                    ) : (
                      // Other cards: fully blurred
                      <div style={{
                        position: "absolute", inset: 0,
                        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                        background: "rgba(var(--bg-rgb, 11,15,25), 0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexDirection: "column", gap: 8,
                      }}>
                        <span style={{ fontSize: 36 }}>🔒</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>Zaključano · Pro plan</span>
                      </div>
                    )}
                  </>
                )}

                {/* Pro: show open hint */}
                {!locked && hasFile && (
                  <div style={{
                    position: "absolute", bottom: 10, right: 10,
                    padding: "4px 10px", borderRadius: 8,
                    background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)",
                    fontSize: 11, fontWeight: 600, color: "#A78BFA",
                  }}>
                    Klikni da otvoriš ↗
                  </div>
                )}

                {/* Pro + no file */}
                {!locked && !hasFile && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column", gap: 6, background: "rgba(0,0,0,0.05)",
                  }}>
                    <span style={{ fontSize: 24 }}>📋</span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>Dokument dolazi uskoro</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                  background: locked ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                  border: `1px solid ${locked ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                  color: locked ? "#F87171" : "#4ADE80",
                }}>
                  {locked ? "🔒 Zaključano" : "✓ Dostupno"}
                </span>
                {!locked && hasFile && (
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>PDF · Čitaj online</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Document viewer modal */}
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
            {/* Modal header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{openDoc.icon}</span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{openDoc.title}</h2>
                  <p style={{ fontSize: 12, color: "var(--text3)", margin: 0, marginTop: 2 }}>{openDoc.desc}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <a href={openDoc.url} target="_blank" rel="noreferrer"
                  style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#A78BFA", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  Preuzmi ↗
                </a>
                <button onClick={() => setOpenDoc(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 16, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ×
                </button>
              </div>
            </div>
            {/* Document content */}
            <div style={{ flex: 1, overflow: "hidden", borderRadius: "0 0 20px 20px" }}>
              {getFileType(openDoc.url) === "pdf" ? (
                <iframe
                  src={`${openDoc.url}#toolbar=0`}
                  style={{ width: "100%", height: "100%", minHeight: "70vh", border: "none" }}
                  title={openDoc.title}
                />
              ) : getFileType(openDoc.url) === "image" ? (
                <div style={{ padding: 24, overflowY: "auto", maxHeight: "70vh" }}>
                  <img src={openDoc.url} alt={openDoc.title} style={{ width: "100%", borderRadius: 12 }} />
                </div>
              ) : (
                <div style={{ padding: 24, overflowY: "auto", maxHeight: "70vh", textAlign: "center", color: "var(--text3)" }}>
                  <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📄</span>
                  <p style={{ marginBottom: 16 }}>Ovaj format se ne može prikazati direktno.</p>
                  <a href={openDoc.url} target="_blank" rel="noreferrer" className="btn btn-primary">
                    Otvori/Preuzmi dokument ↗
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
