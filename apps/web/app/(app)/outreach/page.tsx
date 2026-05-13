"use client";
import { useState, useEffect } from "react";

const professions = ["Video editor", "Copywriter", "Grafički dizajner", "Web dizajner", "SMM menadžer", "Fotograf"];

export default function Outreach() {
  const [profession, setProfession] = useState("Web dizajner");
  const [templates, setTemplates] = useState<any>(null);
  const [language, setLanguage] = useState("SR");
  const [form, setForm] = useState({ imeKlijenta: "", kompanija: "", mojaNisa: "" });
  const [copied, setCopied] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"dm"|"email"|"followup">("dm");

  useEffect(() => {
    fetch(`http://localhost:4000/api/outreach/${encodeURIComponent(profession)}`)
      .then(r => r.json())
      .then(setTemplates)
      .catch(() => setTemplates(null));
  }, [profession]);

  function fill(text: string) {
    if (!text) return "";
    return text
      .replace(/{ime klijenta}/g, form.imeKlijenta || "[ime klijenta]")
      .replace(/{kompanija}/g, form.kompanija || "[kompanija]")
      .replace(/{moja niša}/g, form.mojaNisa || profession)
      .replace(/{personalizovan link}/g, "https://pikmi.app/tvoj-link");
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function getRaw(type: "dm"|"email"|"followup") {
    if (!templates) return "";
    const map = {
      dm:       language === "SR" ? templates.cold_dm_sr    : templates.cold_dm_en,
      email:    language === "SR" ? templates.cold_email_sr : templates.cold_email_en,
      followup: language === "SR" ? templates.follow_up_sr  : templates.follow_up_en,
    };
    return map[type] || "";
  }

  const tabs = [
    { key: "dm"      as const, label: "Cold DM",   icon: "💬" },
    { key: "email"   as const, label: "Cold Email", icon: "✉️" },
    { key: "followup"as const, label: "Follow-up",  icon: "🔁" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Outreach kit</h1>
        <p className="page-subtitle">Šabloni za cold DM, email i follow-up prilagođeni tvojoj profesiji</p>
      </div>

      <div className="grid-2" style={{ gap: 32, alignItems: "start" }}>
        {/* Sidebar filters */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Podešavanja</h2>
            <div className="field">
              <label className="label">Profesija</label>
              <div className="flex flex-col gap-2">
                {professions.map(p => (
                  <button key={p} onClick={() => setProfession(p)}
                    style={{
                      padding: "10px 14px", borderRadius: 10, border: "1px solid",
                      borderColor: profession === p ? "rgba(124,58,237,0.5)" : "var(--border)",
                      background: profession === p ? "rgba(124,58,237,0.1)" : "transparent",
                      color: profession === p ? "#A78BFA" : "var(--text2)",
                      cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 500,
                      fontFamily: "inherit", transition: "all 0.15s",
                    }}>
                    {profession === p && "✦ "}{p}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="label">Jezik šablona</label>
              <div className="flex gap-2">
                {[{ v: "SR", l: "🇷🇸 Srpski" }, { v: "EN", l: "🇬🇧 Engleski" }].map(lang => (
                  <button key={lang.v} onClick={() => setLanguage(lang.v)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10, border: "1px solid",
                      borderColor: language === lang.v ? "rgba(124,58,237,0.5)" : "var(--border)",
                      background: language === lang.v ? "rgba(124,58,237,0.1)" : "transparent",
                      color: language === lang.v ? "#A78BFA" : "var(--text2)",
                      cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                    }}>
                    {lang.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Personalizuj</h2>
            <div className="field">
              <label className="label">Ime klijenta</label>
              <input className="input" placeholder="Marko" value={form.imeKlijenta} onChange={e => setForm(f => ({ ...f, imeKlijenta: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Kompanija</label>
              <input className="input" placeholder="Acme d.o.o." value={form.kompanija} onChange={e => setForm(f => ({ ...f, kompanija: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Moja niša (opciono)</label>
              <input className="input" placeholder={profession} value={form.mojaNisa} onChange={e => setForm(f => ({ ...f, mojaNisa: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Templates */}
        <div>
          {/* Tab bar */}
          <div className="flex gap-2 mb-4">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`btn btn-sm ${activeTab === t.key ? "btn-primary" : "btn-ghost"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {!templates ? (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
              Učitavanje šablona...
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{profession} · {language === "SR" ? "Srpski" : "Engleski"}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => copy(fill(getRaw(activeTab)), activeTab)}>
                  {copied === activeTab ? "✓ Kopirano!" : "📋 Kopiraj sve"}
                </button>
              </div>

              <div className="template-block">
                <pre className="template-text">{fill(getRaw(activeTab)) || "Šablon nije dostupan za ovu kombinaciju."}</pre>
              </div>

              <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6, marginTop: 12 }}>
                💡 <strong style={{ color: "var(--text2)" }}>Savet:</strong> Uvek prilagodi poruku pre slanja. Personalizovane poruke imaju 3× veći response rate.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
