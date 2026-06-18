"use client";
// ─────────────────────────────────────────────────────────────────────────────
// Accordion editor za KORAK POPUNJAVANJA PORTFOLIJA pri registraciji (needsSetup).
// Prikazuje se umesto živog editora samo u setup modu. Tema (svetla/tamna) se
// preuzima iz korisnikove izabrane teme preko `tk` (themeTokens), ne sa dizajna.
// Bindovan na `draft` iz moj-profil (autosave je tamo, debounced).
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { getPlaceholders } from "../../../lib/professions";

type AnyProfile = any;
type TK = any;

interface Props {
  draft: AnyProfile;
  setDraft: React.Dispatch<React.SetStateAction<AnyProfile>>;
  tk: TK;
  profession: string;
  /** done mapa za 5 obaveznih sadržajnih sekcija (service/pricing/stack/experience/testimonial) */
  done: Record<string, boolean>;
  uploadAvatar: (f: File) => void;
  uploadImage: (i: number, f: File) => void;
  uploadingAvatar: boolean;
  uploading: number | null;
  onPreview: () => void;
  onFinish: () => void;
  finishing: boolean;
  isMobile: boolean;
}

interface SectionDef {
  key: string; label: string; subtitle: string; icon: string; required: boolean;
}

const SECTIONS: SectionDef[] = [
  { key: "profil",      label: "Profil",          subtitle: "Ime, fotografija, grad i godine iskustva", icon: "👤", required: true },
  { key: "service",     label: "Šta radim",       subtitle: "Tvoja glavna usluga i opis",               icon: "💼", required: true },
  { key: "pricing",     label: "Paketi",          subtitle: "Tvoje cene i šta svaki paket uključuje",   icon: "🏷️", required: true },
  { key: "portfolio",   label: "Prethodni radovi", subtitle: "Uploaduj svoje radove (nije obavezno)",   icon: "🖼️", required: false },
  { key: "stack",       label: "Veštine",         subtitle: "Alati i programi koje koristiš",           icon: "⚡", required: true },
  { key: "experience",  label: "Iskustvo",        subtitle: "Tvoja radna istorija",                     icon: "📈", required: true },
  { key: "testimonial", label: "Reči klijenata",  subtitle: "Recenzije zadovoljnih klijenata",          icon: "💬", required: true },
  { key: "cta",         label: "CTA sekcija",     subtitle: "Poziv na akciju na dnu portfolija",        icon: "📣", required: true },
];

export default function SetupEditor(props: Props) {
  const { draft, setDraft, tk, profession, done, isMobile } = props;
  const [open, setOpen] = useState<string>("profil");
  const [bannerOff, setBannerOff] = useState(false);
  const PH = getPlaceholders(profession || "Ostalo");

  const d = draft || {};

  // ── done po svakoj prikazanoj sekciji ──
  const doneMap: Record<string, boolean> = {
    profil:      !!(String(d.firstName || "").trim() && String(d.city || "").trim() && String(d.yearsExperience || "").trim() && String(d.avatarUrl || "").trim()),
    service:     !!done.service,
    pricing:     !!done.pricing,
    portfolio:   (d.csImages || []).some((x: string) => !!x),
    stack:       !!done.stack,
    experience:  !!done.experience,
    testimonial: !!done.testimonial,
    cta:         !!String(d.ctaTitle || "").trim(),
  };
  const reqSections = SECTIONS.filter(s => s.required);
  const filled = reqSections.filter(s => doneMap[s.key]).length;
  const percent = Math.round((filled / reqSections.length) * 100);
  // Sve obavezne sekcije moraju biti popunjene da bi mogao dalje (Prethodni radovi su opcioni).
  const allRequiredDone = filled === reqSections.length;

  // ── update helpers ──
  const set = (patch: AnyProfile) => setDraft((prev: AnyProfile) => prev ? { ...prev, ...patch } : prev);
  const setArr = (key: string, idx: number, patch: AnyProfile) => setDraft((prev: AnyProfile) => {
    if (!prev) return prev;
    const arr = [...(prev[key] || [])];
    arr[idx] = { ...(arr[idx] || {}), ...patch };
    return { ...prev, [key]: arr };
  });
  const addRow = (key: string, row: AnyProfile, max = 6) => setDraft((prev: AnyProfile) => {
    if (!prev) return prev;
    const arr = [...(prev[key] || [])];
    if (arr.length >= max) return prev;
    return { ...prev, [key]: [...arr, row] };
  });
  const removeRow = (key: string, idx: number) => setDraft((prev: AnyProfile) => {
    if (!prev) return prev;
    const arr = [...(prev[key] || [])]; arr.splice(idx, 1);
    return { ...prev, [key]: arr };
  });

  // ── themed styles ──
  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: 10, fontSize: 14,
    border: `1px solid ${tk.blockBorder}`, background: tk.sectionBg || "rgba(125,125,125,0.06)",
    color: tk.textPrimary, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
    color: tk.textMuted, display: "block", marginBottom: 7,
  };
  const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div style={{ marginBottom: 14 }}><label style={lbl}>{label}</label>{children}</div>;
  }

  // ── per-section form ──
  function renderForm(key: string) {
    switch (key) {
      case "profil":
        return (
          <div>
            <Field label="Profilna slika">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {d.avatarUrl
                  ? <img src={d.avatarUrl} alt="" style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 60, height: 60, borderRadius: 14, background: `linear-gradient(135deg,${tk.accent},${tk.accent}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{(d.firstName?.[0] || "") + (d.lastName?.[0] || "") || "?"}</div>
                }
                <label style={{ padding: "9px 16px", borderRadius: 10, background: tk.accentBg, color: tk.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${tk.blockBorder}` }}>
                  {props.uploadingAvatar ? "Otpremam..." : d.avatarUrl ? "Promeni sliku" : "Dodaj sliku"}
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={props.uploadingAvatar} onChange={e => { const f = e.target.files?.[0]; if (f) props.uploadAvatar(f); e.currentTarget.value = ""; }} />
                </label>
              </div>
            </Field>
            <div style={grid2}>
              <Field label="Ime"><input style={inp} value={d.firstName || ""} onChange={e => set({ firstName: e.target.value })} placeholder="Marija" /></Field>
              <Field label="Prezime"><input style={inp} value={d.lastName || ""} onChange={e => set({ lastName: e.target.value })} placeholder="Stanković" /></Field>
            </div>
            <div style={grid2}>
              <Field label="Grad"><input style={inp} value={d.city || ""} onChange={e => set({ city: e.target.value })} placeholder="Novi Sad" /></Field>
              <Field label="Godine iskustva"><input style={inp} value={d.yearsExperience || ""} onChange={e => set({ yearsExperience: e.target.value })} placeholder="6" /></Field>
            </div>
          </div>
        );
      case "service":
        return (
          <div>
            <Field label="Naslov usluge"><input style={inp} value={d.serviceTitle || ""} onChange={e => set({ serviceTitle: e.target.value })} placeholder={PH.serviceTitle} /></Field>
            <Field label="Opis"><textarea style={{ ...inp, minHeight: 90, resize: "vertical" }} value={d.serviceDesc || ""} onChange={e => set({ serviceDesc: e.target.value })} placeholder={PH.serviceDesc} /></Field>
          </div>
        );
      case "pricing": {
        const rows = (d.pricing && d.pricing.length > 0) ? d.pricing : [{ name: "", price: "", desc: "" }];
        return (
          <div>
            {rows.map((tier: AnyProfile, i: number) => (
              <div key={i} style={{ border: `1px solid ${tk.blockBorder}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tk.textMuted }}>Paket {i + 1}</span>
                  {rows.length > 1 && <button onClick={() => removeRow("pricing", i)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Ukloni</button>}
                </div>
                <div style={grid2}>
                  <input style={{ ...inp, marginBottom: 10 }} value={tier.name || ""} onChange={e => setArr("pricing", i, { name: e.target.value })} placeholder={PH.pricing?.[i]?.name || "Starter"} />
                  <input style={{ ...inp, marginBottom: 10 }} value={tier.price || ""} onChange={e => setArr("pricing", i, { price: e.target.value })} placeholder={PH.pricing?.[i]?.price || "€500"} />
                </div>
                <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={tier.desc || ""} onChange={e => setArr("pricing", i, { desc: e.target.value })} placeholder={PH.pricing?.[i]?.desc || "Šta je uključeno u ovaj paket..."} />
              </div>
            ))}
            {rows.length < 3 && (
              <button onClick={() => addRow("pricing", { name: "", price: "", desc: "" }, 3)} style={{ padding: "9px 14px", borderRadius: 8, border: `1px dashed ${tk.blockBorder}`, background: "transparent", color: tk.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Dodaj paket</button>
            )}
          </div>
        );
      }
      case "portfolio":
        return (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: tk.textMuted, lineHeight: 1.5 }}>Dodaj do 4 slike svojih radova. Ova sekcija nije obavezna.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[0, 1, 2, 3].map(i => (
                <label key={i} style={{ aspectRatio: "4/3", borderRadius: 12, border: `1px dashed ${tk.blockBorder}`, background: d.csImages?.[i] ? "transparent" : (tk.sectionBg || "rgba(125,125,125,0.06)"), cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {d.csImages?.[i]
                    ? <img src={d.csImages[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 13, color: tk.textMuted }}>{props.uploading === i ? "Otpremam..." : "+ Slika"}</span>}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) props.uploadImage(i, f); e.currentTarget.value = ""; }} />
                </label>
              ))}
            </div>
          </div>
        );
      case "stack":
        return (
          <Field label="Veštine (odvoji zarezom)">
            <input style={inp} value={d.stack || ""} onChange={e => set({ stack: e.target.value })} placeholder={(PH.skills || []).join(", ")} />
          </Field>
        );
      case "experience": {
        const rows = (d.experience && d.experience.length > 0) ? d.experience : [{ company: "", role: "", dateFrom: "", dateTo: "", desc: "" }];
        return (
          <div>
            {rows.map((ex: AnyProfile, i: number) => (
              <div key={i} style={{ border: `1px solid ${tk.blockBorder}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tk.textMuted }}>Iskustvo {i + 1}</span>
                  {rows.length > 1 && <button onClick={() => removeRow("experience", i)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Ukloni</button>}
                </div>
                <div style={grid2}>
                  <input style={{ ...inp, marginBottom: 10 }} value={ex.company || ""} onChange={e => setArr("experience", i, { company: e.target.value })} placeholder={PH.experience?.[i]?.company || "Firma / klijent"} />
                  <input style={{ ...inp, marginBottom: 10 }} value={ex.role || ""} onChange={e => setArr("experience", i, { role: e.target.value })} placeholder={PH.experience?.[i]?.role || "Tvoja uloga"} />
                </div>
                <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={ex.desc || ""} onChange={e => setArr("experience", i, { desc: e.target.value })} placeholder={PH.experience?.[i]?.desc || "Šta si radio i kakav je bio rezultat..."} />
              </div>
            ))}
            {rows.length < 5 && (
              <button onClick={() => addRow("experience", { company: "", role: "", dateFrom: "", dateTo: "", desc: "" }, 5)} style={{ padding: "9px 14px", borderRadius: 8, border: `1px dashed ${tk.blockBorder}`, background: "transparent", color: tk.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Dodaj iskustvo</button>
            )}
          </div>
        );
      }
      case "testimonial": {
        const rows = (d.testimonials && d.testimonials.length > 0) ? d.testimonials : [{ quote: "", name: "", title: "" }];
        return (
          <div>
            {rows.map((tt: AnyProfile, i: number) => (
              <div key={i} style={{ border: `1px solid ${tk.blockBorder}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tk.textMuted }}>Recenzija {i + 1}</span>
                  {rows.length > 1 && <button onClick={() => removeRow("testimonials", i)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Ukloni</button>}
                </div>
                <textarea style={{ ...inp, minHeight: 60, resize: "vertical", marginBottom: 10 }} value={tt.quote || ""} onChange={e => setArr("testimonials", i, { quote: e.target.value })} placeholder={PH.testimonial?.quote || "Šta je klijent rekao o saradnji..."} />
                <div style={grid2}>
                  <input style={inp} value={tt.name || ""} onChange={e => setArr("testimonials", i, { name: e.target.value })} placeholder={PH.testimonial?.name || "Ime klijenta"} />
                  <input style={inp} value={tt.title || ""} onChange={e => setArr("testimonials", i, { title: e.target.value })} placeholder={PH.testimonial?.title || "Pozicija, firma"} />
                </div>
              </div>
            ))}
            {rows.length < 5 && (
              <button onClick={() => addRow("testimonials", { quote: "", name: "", title: "" }, 5)} style={{ padding: "9px 14px", borderRadius: 8, border: `1px dashed ${tk.blockBorder}`, background: "transparent", color: tk.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Dodaj recenziju</button>
            )}
          </div>
        );
      }
      case "cta":
        return (
          <div>
            <Field label="Naslov poziva"><input style={inp} value={d.ctaTitle || ""} onChange={e => set({ ctaTitle: e.target.value })} placeholder="Spreman da počnemo?" /></Field>
            <Field label="Istaknuti deo"><input style={inp} value={d.ctaHighlight || ""} onChange={e => set({ ctaHighlight: e.target.value })} placeholder="Javi se i dogovaramo poziv." /></Field>
          </div>
        );
      default:
        return null;
    }
  }

  // ── badge ──
  function Badge({ on }: { on: boolean }) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
        padding: "3px 10px", borderRadius: 999,
        color: on ? "#16A34A" : tk.textMuted,
        background: on ? "rgba(34,197,94,0.14)" : (tk.tagBg || "rgba(125,125,125,0.12)"),
      }}>{on ? "Popunjeno" : "Prazno"}</span>
    );
  }

  // ── accordion item ──
  function AccordionItem({ s }: { s: SectionDef }) {
    const isOpen = open === s.key;
    return (
      <div id={`setup-sec-${s.key}`} style={{ background: tk.blockBg, border: `1px solid ${tk.blockBorder}`, borderRadius: 16, marginBottom: 12, overflow: "hidden", boxShadow: tk.blockShadow }}>
        <button onClick={() => setOpen(isOpen ? "" : s.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: tk.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: tk.textPrimary }}>{s.label}</div>
            <div style={{ fontSize: 12, color: tk.textMuted, marginTop: 2 }}>{s.subtitle}</div>
          </div>
          <Badge on={doneMap[s.key]} />
          <span style={{ fontSize: 12, color: tk.textMuted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▼</span>
        </button>
        {isOpen && <div style={{ padding: "4px 18px 20px", borderTop: `1px solid ${tk.divider}` }}>{renderForm(s.key)}</div>}
      </div>
    );
  }

  const accent = tk.accent;
  const finishBtn = (full?: boolean) => {
    const blocked = props.finishing || !allRequiredDone;
    return (
      <button onClick={props.onFinish} disabled={blocked}
        title={!allRequiredDone ? "Popuni sve obavezne sekcije (osim „Prethodni radovi“) da nastaviš" : undefined}
        style={{
          padding: full ? "14px 0" : "10px 20px", width: full ? "100%" : undefined,
          borderRadius: 12, border: "none",
          background: blocked ? (tk.tagBg || "rgba(125,125,125,0.2)") : `linear-gradient(135deg,${accent},${accent}cc)`,
          color: blocked ? tk.textMuted : "#fff", fontSize: 14, fontWeight: 700,
          cursor: props.finishing ? "wait" : (allRequiredDone ? "pointer" : "not-allowed"),
          fontFamily: "inherit", boxShadow: blocked ? "none" : `0 6px 20px ${accent}55`,
          opacity: (blocked && !props.finishing) ? 0.85 : 1,
        }}>{props.finishing ? "Čuvam..." : "Sačuvaj i nastavi →"}</button>
    );
  };
  const finishHint = !allRequiredDone ? (
    <div style={{ fontSize: 11, color: tk.textMuted, lineHeight: 1.5, marginTop: 10, textAlign: "center" }}>
      Popuni sve sekcije (osim „Prethodni radovi“) da nastaviš.
    </div>
  ) : null;

  const previewBtn = (
    <button onClick={props.onPreview} style={{
      padding: "10px 18px", borderRadius: 12, background: "transparent",
      border: `1px solid ${tk.blockBorder}`, color: tk.textSecond || tk.textPrimary,
      fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
      display: "flex", alignItems: "center", gap: 7,
    }}>👁 {isMobile ? "Pregled" : "Pregled portfolija"}</button>
  );

  const banner = !bannerOff && (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 12, background: tk.accentBg, border: `1px solid ${tk.blockBorder}`, marginBottom: 16 }}>
      <span style={{ fontSize: 15 }}>👆</span>
      <span style={{ flex: 1, fontSize: 13, color: tk.textSecond || tk.textPrimary, lineHeight: 1.5 }}>Klikni na bilo koju sekciju i menjaj sivi primer svojim sadržajem. Čuva se automatski.</span>
      <button onClick={() => setBannerOff(true)} style={{ background: "none", border: "none", color: tk.textMuted, fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );

  const sliderBadges = (
    <div className="pikmi-setup-slider" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 0 10px", WebkitOverflowScrolling: "touch" }}>
      {SECTIONS.map(s => (
        <button key={s.key} onClick={() => { setOpen(s.key); setTimeout(() => document.getElementById(`setup-sec-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }} style={{
          display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
          padding: "8px 14px", borderRadius: 999, fontFamily: "inherit",
          border: open === s.key ? `1px solid ${accent}` : `1px solid ${tk.blockBorder}`,
          background: open === s.key ? tk.accentBg : "transparent",
          color: open === s.key ? accent : (tk.textSecond || tk.textPrimary), fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: doneMap[s.key] ? "#22C55E" : tk.textMuted, flexShrink: 0 }} />
          {s.label}
        </button>
      ))}
    </div>
  );

  const accordionList = <div>{SECTIONS.map(s => <AccordionItem key={s.key} s={s} />)}</div>;

  const sidebar = (
    <aside style={{ width: 260, flexShrink: 0, position: "sticky", top: 88, alignSelf: "flex-start" }}>
      <div style={{ background: tk.blockBg, border: `1px solid ${tk.blockBorder}`, borderRadius: 16, padding: 18, boxShadow: tk.blockShadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: tk.textSecond || tk.textPrimary }}>Tvoj portfolio</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>{percent}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: tk.divider, overflow: "hidden", marginBottom: 18 }}>
          <div style={{ height: "100%", width: `${percent}%`, background: `linear-gradient(90deg,${accent},${accent}aa)`, borderRadius: 999, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: tk.textMuted, marginBottom: 10 }}>Sekcije</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => { setOpen(s.key); setTimeout(() => document.getElementById(`setup-sec-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 10,
              background: open === s.key ? tk.accentBg : "transparent", border: "none", cursor: "pointer",
              fontFamily: "inherit", textAlign: "left", width: "100%",
            }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{s.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: open === s.key ? accent : (tk.textSecond || tk.textPrimary) }}>{s.label}</span>
              {doneMap[s.key]
                ? <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#22C55E", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
                : <span style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${tk.blockBorder}`, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
        {finishHint}
      </div>
    </aside>
  );

  return (
    <div style={{ minHeight: "100vh", background: tk.pageBg, position: "relative", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`.pikmi-setup-slider::-webkit-scrollbar{display:none}.pikmi-setup-slider{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      {/* pattern */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: tk.pattern?.image, backgroundSize: tk.pattern?.size, backgroundRepeat: "repeat", opacity: 0.6 }} />

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "16px 32px", background: tk.pageBg, borderBottom: `1px solid ${tk.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/pikmilogo.jpg" alt="pikmi" width={26} height={26} style={{ objectFit: "contain", borderRadius: 7 }} />
          <span style={{ fontSize: 20, fontWeight: 900, color: tk.textPrimary }}>pikmi</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {previewBtn}
          {!isMobile && finishBtn(false)}
        </div>
      </header>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px 16px 100px" : "24px 32px 64px" }}>
        {/* Mobile: progress + slider */}
        {isMobile && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: tk.textSecond || tk.textPrimary }}>Tvoj portfolio</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>{percent}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: tk.divider, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${percent}%`, background: `linear-gradient(90deg,${accent},${accent}aa)`, borderRadius: 999, transition: "width 0.3s" }} />
            </div>
            {sliderBadges}
          </div>
        )}

        {banner}

        {isMobile ? (
          accordionList
        ) : (
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {sidebar}
            <main style={{ flex: 1, minWidth: 0 }}>{accordionList}</main>
          </div>
        )}
      </div>

      {/* Mobile sticky finish */}
      {isMobile && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30, padding: "10px 16px 12px", background: tk.pageBg, borderTop: `1px solid ${tk.divider}` }}>
          {finishHint}
          {finishBtn(true)}
        </div>
      )}
    </div>
  );
}
