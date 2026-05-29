"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";

type PlanStatus = "loading" | "pro" | "trial" | "expired";

const professions = ["Video editor", "Copywriter", "Grafički dizajner", "Web dizajner", "SMM menadžer", "Fotograf"];

const TEMPLATES: Record<string, Record<string, string>> = {
  "Web dizajner": {
    cold_dm_sr: `Hej {ime klijenta} 👋

Primetio sam da {kompanija} još uvek nema moderan sajt koji konvertuje posetioce u klijente — ili postoji ali ima prostora za poboljšanje.

Ja sam {moja niša} koji pomaže malim i srednjim firmama da izgledaju profesionalnije i privuku više klijenata online.

Napravio sam kratak pregled ideja za {kompanija}: {personalizovan link}

Slobodan da porazgovaramo 5 min?`,
    cold_dm_en: `Hey {ime klijenta} 👋

I noticed {kompanija} could benefit from a more modern website that converts visitors into clients.

I'm a {moja niša} helping small businesses look more professional and attract more clients online.

I put together a quick pitch with ideas for {kompanija}: {personalizovan link}

Would you have 5 min to chat?`,
    cold_email_sr: `Pozdrav {ime klijenta},

Naišao sam na {kompanija} i odmah sam video nekoliko konkretnih stvari koje bih mogao da poboljšam na vašem sajtu — kako biste privukli više klijenata i izgledali profesionalnije.

Priložio sam kratak pregled mojih ideja i prethodnih projekata:
👉 {personalizovan link}

Dostupan sam za kratak poziv ove ili sledeće sedmice — samo mi javite.

Srdačno,
{moja niša}`,
    cold_email_en: `Hi {ime klijenta},

I came across {kompanija} and immediately spotted a few concrete improvements I could make to your website — to attract more clients and look more professional.

I've attached a short overview of my ideas and past projects:
👉 {personalizovan link}

I'm available for a quick call this or next week — just let me know.

Best,
{moja niša}`,
    follow_up_sr: `Hej {ime klijenta},

Samo da proverim — jesi li imao/la prilike da pogledaš materijale koje sam poslao/la?

{personalizovan link}

Razumem da si zauzet/a, ali mislim da možemo da napravimo nešto odlično zajedno. Javi mi par reči 🙂`,
    follow_up_en: `Hey {ime klijenta},

Just checking in — did you get a chance to look at the materials I sent?

{personalizovan link}

I know you're busy, but I think we could do something great together. Let me know 🙂`,
  },
  "Video editor": {
    cold_dm_sr: `Hej {ime klijenta} 👋

Pratim {kompanija} i primetio/la sam da vaš video sadržaj ima potencijal za veći reach — malo bolja montaža i hook na početku može da utrostruči preglede.

Ja sam {moja niša} koji sarađuje sa brendovima i kreatorima.

Pogledaj moj portfolio: {personalizovan link}

Ima li smisla da popričamo?`,
    cold_dm_en: `Hey {ime klijenta} 👋

I've been following {kompanija} and noticed your video content has room to grow — better editing and a strong hook can triple your views.

I'm a {moja niša} working with brands and creators.

Check out my portfolio: {personalizovan link}

Would love to chat!`,
    cold_email_sr: `Pozdrav {ime klijenta},

Video sadržaj je trenutno najmoćniji alat za rast na društvenim mrežama — ali samo ako je dobro urađen.

Radio/la sam sa sličnim firmama i pomogao/la im da povećaju engagement i follower bazu kroz kvalitetnu montažu i storytelling.

Moj rad možeš videti ovde: {personalizovan link}

Slobodan/a sam za kratak poziv ove sedmice.`,
    cold_email_en: `Hi {ime klijenta},

Video content is the most powerful growth tool on social media — but only when done right.

I've worked with similar companies and helped them boost engagement and followers through quality editing and storytelling.

You can see my work here: {personalizovan link}

I'm free for a quick call this week.`,
    follow_up_sr: `Hej {ime klijenta},

Šaljem kratki podsjetnik — da li si imao/la prilike da pogledaš portfolio?

{personalizovan link}

Rado bih ti pokazao/la konkretne ideje za {kompanija}. 🎬`,
    follow_up_en: `Hey {ime klijenta},

Sending a quick follow-up — did you get a chance to check out the portfolio?

{personalizovan link}

I'd love to show you some specific ideas for {kompanija}. 🎬`,
  },
  "Copywriter": {
    cold_dm_sr: `Hej {ime klijenta} 👋

Pročitao/la sam tekstove na sajtu {kompanija} i imam par ideja kako da ih poboljšamo — da čitaoci ostaju duže i da se više konvertuju u klijente.

Ja sam {moja niša} koji piše prodajne tekstove za firme kao vaša.

Kratki pregled: {personalizovan link}

Šta mislite?`,
    cold_dm_en: `Hey {ime klijenta} 👋

I read through {kompanija}'s website copy and have a few ideas on how to improve it — keeping readers engaged longer and converting more of them into clients.

I'm a {moja niša} writing sales copy for businesses like yours.

Quick overview: {personalizovan link}

What do you think?`,
    cold_email_sr: `Pozdrav {ime klijenta},

Dobar copy nije samo tekst — to je vaš najbolji prodavač koji radi 24/7.

Primetio/la sam da na sajtu {kompanija} postoji prostor da se poboljša konverzija kroz jasniju komunikaciju vrednosti.

Pogledajte moje prethodne projekte i rezultate: {personalizovan link}

Javi mi se ako ste zainteresovani za saradnju.`,
    cold_email_en: `Hi {ime klijenta},

Good copy isn't just text — it's your best salesperson working 24/7.

I noticed {kompanija}'s website has room to improve conversion through clearer value communication.

Check out my past projects and results: {personalizovan link}

Let me know if you're interested in working together.`,
    follow_up_sr: `Hej {ime klijenta},

Samo da proverim — da li si video/la materijale?

{personalizovan link}

Imam konkretne ideje za {kompanija} koje bih rado podijelio/la. ✍️`,
    follow_up_en: `Hey {ime klijenta},

Just checking in — did you see the materials?

{personalizovan link}

I have specific ideas for {kompanija} I'd love to share. ✍️`,
  },
  "Grafički dizajner": {
    cold_dm_sr: `Hej {ime klijenta} 👋

Primetio/la sam da vizuelni identitet {kompanija} ne odražava u potpunosti kvalitet vašeg posla — mali rebranding može napraviti veliku razliku u percepciji klijenata.

Ja sam {moja niša} i ovo je moj portfolio: {personalizovan link}

Ima li smisla da razgovaramo?`,
    cold_dm_en: `Hey {ime klijenta} 👋

I noticed {kompanija}'s visual identity doesn't fully reflect the quality of your work — a small rebrand can make a big difference in how clients perceive you.

I'm a {moja niša} and here's my portfolio: {personalizovan link}

Does it make sense to chat?`,
    cold_email_sr: `Pozdrav {ime klijenta},

Vizuelni identitet je prvo što klijenti vide — i često određuje da li ostaju ili odlaze.

Specijalizovao/la sam se za brendiranje malih i srednjih firmi i pomogao/la sam desetinama biznisa da izgledaju profesionalnije.

Pogledajte moj rad: {personalizovan link}

Slobodan/a sam za konsultaciju ove sedmice.`,
    cold_email_en: `Hi {ime klijenta},

Visual identity is the first thing clients see — and often determines whether they stay or leave.

I specialize in branding for small and medium businesses and have helped dozens of companies look more professional.

See my work: {personalizovan link}

I'm free for a consultation this week.`,
    follow_up_sr: `Hej {ime klijenta},

Šaljem podsjetnik — da li si imao/la prilike da pogledaš portfolio?

{personalizovan link}

Rado bih napravio/la nešto posebno za {kompanija}. 🎨`,
    follow_up_en: `Hey {ime klijenta},

Sending a reminder — did you get a chance to look at the portfolio?

{personalizovan link}

I'd love to create something special for {kompanija}. 🎨`,
  },
  "SMM menadžer": {
    cold_dm_sr: `Hej {ime klijenta} 👋

Pratim stranice {kompanija} na društvenim mrežama i imam konkretne ideje kako da povećamo engagement i privučemo više pratilaca.

Ja sam {moja niša} — pogledaj moje rezultate: {personalizovan link}

Ima li smisla da popričamo 15 min?`,
    cold_dm_en: `Hey {ime klijenta} 👋

I've been watching {kompanija}'s social media and have specific ideas on how to boost engagement and attract more followers.

I'm a {moja niša} — check out my results: {personalizovan link}

Would it make sense to chat for 15 min?`,
    cold_email_sr: `Pozdrav {ime klijenta},

Upravljanje društvenim mrežama nije samo postovanje — to je strateški alat za rast biznisa.

Pomogao/la sam firmama poput {kompanija} da povećaju reach, engagement i konverzije kroz konzistentnu i kvalitetnu prisutnost na mrežama.

Pogledajte moje rezultate: {personalizovan link}

Slobodan/a sam za razgovor ove sedmice.`,
    cold_email_en: `Hi {ime klijenta},

Social media management isn't just posting — it's a strategic business growth tool.

I've helped businesses like {kompanija} increase reach, engagement, and conversions through consistent, quality social presence.

See my results: {personalizovan link}

I'm free to chat this week.`,
    follow_up_sr: `Hej {ime klijenta},

Samo kratki podsjetnik — da li si imao/la prilike da pogledaš materijale?

{personalizovan link}

Imam plan za {kompanija} spreman. 📱`,
    follow_up_en: `Hey {ime klijenta},

Just a quick follow-up — did you get a chance to review the materials?

{personalizovan link}

I have a plan ready for {kompanija}. 📱`,
  },
  "Fotograf": {
    cold_dm_sr: `Hej {ime klijenta} 👋

Primetio/la sam da {kompanija} koristi generičke stock fotografije — profesionalne fotke mogu drastično poboljšati percepciju vašeg brenda.

Ja sam {moja niša} koji sarađuje sa lokalnim firmama.

Pogledaj moj portfolio: {personalizovan link}

Možemo li porazgovarati?`,
    cold_dm_en: `Hey {ime klijenta} 👋

I noticed {kompanija} is using generic stock photos — professional photography can drastically improve your brand perception.

I'm a {moja niša} working with local businesses.

Check out my portfolio: {personalizovan link}

Can we chat?`,
    cold_email_sr: `Pozdrav {ime klijenta},

Fotografija je investicija koja se višestruko isplati — profesionalne slike povećavaju poverenje klijenata i konverziju sajta.

Radio/la sam sa firmama poput {kompanija} i moji klijenti su primetili direktan uticaj na prodaju.

Portfolio: {personalizovan link}

Slobodan/a sam za kratki poziv.`,
    cold_email_en: `Hi {ime klijenta},

Photography is an investment that pays off many times over — professional images increase client trust and website conversion.

I've worked with businesses like {kompanija} and my clients have seen a direct impact on sales.

Portfolio: {personalizovan link}

I'm free for a quick call.`,
    follow_up_sr: `Hej {ime klijenta},

Samo da proverim — jesi li video/la portfolio?

{personalizovan link}

Rado bih organizovao/la snimanje za {kompanija}. 📸`,
    follow_up_en: `Hey {ime klijenta},

Just checking — did you see the portfolio?

{personalizovan link}

I'd love to organize a shoot for {kompanija}. 📸`,
  },
};

export default function Outreach() {
  const { t } = useLanguage();
  const [planStatus, setPlanStatus] = useState<PlanStatus>("loading");
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [profession, setProfession] = useState("Web dizajner");
  const [language, setLanguage] = useState("SR");
  const [form, setForm] = useState({ imeKlijenta: "", kompanija: "", mojaNisa: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dm" | "email" | "followup">("dm");

  useEffect(() => {
    async function checkPlan() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!user) { setPlanStatus("expired"); return; }

        const { data } = await supabase
          .from("profiles")
          .select("plan, trial_ends_at")
          .eq("user_id", user.id)
          .single();

        if (data?.plan === "pro") {
          setPlanStatus("pro");
          return;
        }

        if (data?.trial_ends_at) {
          const endsAt = new Date(data.trial_ends_at);
          const now = new Date();
          const diff = endsAt.getTime() - now.getTime();
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

          if (daysLeft > 0) {
            setTrialDaysLeft(daysLeft);
            setPlanStatus("trial");
          } else {
            setPlanStatus("expired");
          }
        } else {
          setPlanStatus("expired");
        }
      } catch {
        setPlanStatus("expired");
      }
    }
    checkPlan();
  }, []);

  function fill(text: string) {
    if (!text) return "";
    return text
      .replace(/{ime klijenta}/g, form.imeKlijenta || "[ime klijenta]")
      .replace(/{kompanija}/g, form.kompanija || "[kompanija]")
      .replace(/{moja niša}/g, form.mojaNisa || profession)
      .replace(/{personalizovan link}/g, "https://pikmi.today/tvoj-link");
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function getRaw(type: "dm" | "email" | "followup") {
    const tpl = TEMPLATES[profession] || TEMPLATES["Web dizajner"];
    const map = {
      dm: language === "SR" ? tpl.cold_dm_sr : tpl.cold_dm_en,
      email: language === "SR" ? tpl.cold_email_sr : tpl.cold_email_en,
      followup: language === "SR" ? tpl.follow_up_sr : tpl.follow_up_en,
    };
    return map[type] || "";
  }

  const tabs = [
    { key: "dm" as const, label: t("outreach_cold_dm"), icon: "💬" },
    { key: "email" as const, label: t("outreach_cold_email"), icon: "✉️" },
    { key: "followup" as const, label: t("outreach_follow_up"), icon: "🔁" },
  ];

  const isLocked = planStatus === "expired";

  return (
    <div style={{ position: "relative" }}>
      <div className="page-header">
        <h1 className="page-title">{t("nav_outreach")}</h1>
        <p className="page-subtitle">{t("outreach_page_sub")}</p>
      </div>

      {/* Trial banner */}
      {planStatus === "trial" && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
          color: "#FCD34D", fontSize: 13, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12,
        }}>
          <span>⏳ Tvoj besplatni trial ističe za <strong>{trialDaysLeft} {trialDaysLeft === 1 ? "dan" : trialDaysLeft < 5 ? "dana" : "dana"}</strong></span>
          <Link href="/billing" className="btn btn-sm" style={{
            background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)",
            color: "#FCD34D", fontSize: 12, padding: "5px 12px",
          }}>
            Kupi Pro →
          </Link>
        </div>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}>
          <div className="card" style={{
            maxWidth: 440, width: "100%", textAlign: "center",
            padding: "40px 36px",
            border: "1px solid rgba(124,58,237,0.3)",
            background: "var(--card)",
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
              {t("outreach_locked_title")}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 8, lineHeight: 1.6 }}>
              {t("outreach_locked_desc")}
            </p>
            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 28, lineHeight: 1.6 }}>
              ✦ Cold DM šabloni za 6 profesija<br />
              ✦ Cold Email šabloni (SR + EN)<br />
              ✦ Follow-up poruke<br />
              ✦ Personalizacija jednim klikom
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
              990 din<span style={{ fontSize: 14, fontWeight: 500, color: "var(--text2)" }}>/mesec</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 24 }}>{t("cancel_anytime")}</div>
            <Link href="/billing" className="btn btn-primary" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              {t("outreach_upgrade_btn")}
            </Link>
            <Link href="/dashboard" style={{ display: "block", marginTop: 14, fontSize: 13, color: "var(--text3)" }}>
              ← {t("nav_dashboard")}
            </Link>
          </div>
        </div>
      )}

      {/* Main content (blurred when locked) */}
      <div style={{ filter: isLocked ? "blur(4px)" : "none", pointerEvents: isLocked ? "none" : "auto", userSelect: isLocked ? "none" : "auto" }}>
        <div className="grid-2" style={{ gap: 32, alignItems: "start" }}>
          {/* Sidebar filters */}
          <div className="flex flex-col gap-4">
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{t("outreach_personalize")}</h2>
              <div className="field">
                <label className="label">{t("outreach_profession")}</label>
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
                <label className="label">{t("language")}</label>
                <div className="flex gap-2">
                  {[{ v: "SR", l: `🇷🇸 ${t("outreach_sr")}` }, { v: "EN", l: `🇬🇧 ${t("outreach_en")}` }].map(lang => (
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
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{t("outreach_personalize")}</h2>
              <div className="field">
                <label className="label">{t("outreach_client_name")}</label>
                <input className="input" placeholder="Marko" value={form.imeKlijenta} onChange={e => setForm(f => ({ ...f, imeKlijenta: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">{t("outreach_company")}</label>
                <input className="input" placeholder="Acme d.o.o." value={form.kompanija} onChange={e => setForm(f => ({ ...f, kompanija: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">{t("outreach_your_name")}</label>
                <input className="input" placeholder={profession} value={form.mojaNisa} onChange={e => setForm(f => ({ ...f, mojaNisa: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Templates */}
          <div>
            <div className="flex gap-2 mb-4">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`btn btn-sm ${activeTab === t.key ? "btn-primary" : "btn-ghost"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                    {profession} · {language === "SR" ? "Srpski" : "Engleski"}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => copy(fill(getRaw(activeTab)), activeTab)}>
                  {copied === activeTab ? `✓ ${t("outreach_copied")}` : `📋 ${t("outreach_copy")}`}
                </button>
              </div>

              <div className="template-block">
                <pre className="template-text">{fill(getRaw(activeTab)) || "Šablon nije dostupan."}</pre>
              </div>

              <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6, marginTop: 12 }}>
                💡 <strong style={{ color: "var(--text2)" }}>Savet:</strong> Uvek prilagodi poruku pre slanja. Personalizovane poruke imaju 3× veći response rate.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
