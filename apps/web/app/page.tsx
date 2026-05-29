import Link from "next/link";
import PikmiLogo from "./components/PikmiLogo";
import CheckoutButton from "./components/CheckoutButton";

export default function Home() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* NAV */}
      <nav className="nav-top">
        <Link href="/" className="nav-logo">
          <PikmiLogo size={32} />
          pikmi
        </Link>
        <ul className="nav-links">
          <li><a href="/#features">Features</a></li>
          <li><a href="/#how">Kako funkcioniše</a></li>
          <li><a href="/#pricing">Cene</a></li>
          <li><Link href="/blog">Blog</Link></li>
        </ul>
        <div className="nav-actions">
          <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 140, paddingBottom: 100, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="hero-glow" style={{ top: -100, left: "50%", transform: "translateX(-50%)" }} />
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          <div className="badge badge-purple" style={{ margin: "0 auto 20px", display: "inline-flex" }}>
            <span>✦</span> Tailored portfolios. Real connections.
          </div>
          <h1 style={{ fontSize: "clamp(42px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Portfolio koji zatvara<br />
            <span className="grad-text-pink">klijente dok spavaš.</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--text2)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.6 }}>
            Personalizovani portfolio link za svakog klijenta. Vidi ko gleda, šta gleda i kada je spreman.
          </p>
          <div className="flex items-center justify-center gap-3 hero-btns">
            <Link href="/register" className="btn btn-primary btn-lg">Kreiraj profil besplatno</Link>
          </div>
        </div>

        {/* Hero mockup card */}
        <div style={{ maxWidth: 480, margin: "64px auto 0", padding: "0 24px" }}>
          <div className="card glow" style={{ textAlign: "left" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar">M</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Hey Marko,</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>ovo je za tebe.</div>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 100, background: "var(--border)", marginBottom: 8 }}>
              <div style={{ height: "100%", width: "72%", borderRadius: 100, background: "var(--grad)" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>Pripremio sam selekciju projekata koji su napravljeni za tvoj brand.</div>
            <div className="grid-3" style={{ gap: 10 }}>
              {["Ukupno linkova", "Otvoreno", "Vreme gledanja"].map((label, i) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{["24", "18", "2h 47m"][i]}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Nedavna otvaranja</div>
            {[
              { name: "Marko Jovanović", time: "danas u 14:27", dur: "2m 31s" },
              { name: "Ana Petrović", time: "juče u 11:20", dur: "1m 18s" },
            ].map((v) => (
              <div key={v.name} className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{v.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{v.time}</div>
                  </div>
                </div>
                <span className="badge badge-purple">{v.dur}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="badge badge-purple mb-4" style={{ margin: "0 auto 16px" }}>Features</div>
          <h2 className="landing-section-title" style={{ fontSize: 40, fontWeight: 800 }}>Sve što ti treba da zatvoriš posao</h2>
        </div>
        <div className="grid-3">
          {[
            { icon: "👤", title: "Personalizovano", desc: "Svaki klijent dobija iskustvo kreirano samo za njega — tvoje radove, tvoju priču.", color: "rgba(124,58,237,0.15)" },
            { icon: "👁", title: "Prati interes", desc: "Vidi kada otvore, šta su gledali i koliko su se zadržali. Real-time notifikacije.", color: "rgba(59,130,246,0.15)" },
            { icon: "📈", title: "Zatvara poslove", desc: "Povećava šanse da te izaberu i da saradujete duže. Hot leads na dlanu.", color: "rgba(236,72,153,0.15)" },
            { icon: "🔗", title: "Pitch linkovi", desc: "Jedan klik deli tvoj personalizovani portfolio. Nema više generičnih CV-jeva.", color: "rgba(34,197,94,0.15)" },
            { icon: "✉️", title: "Outreach kit", desc: "Cold DM, email i follow-up šabloni za svaku profesiju. Samo popuni i pošalji.", color: "rgba(249,115,22,0.15)" },
            { icon: "⚡", title: "Brzo podešavanje", desc: "Profil spreman za 5 minuta. Bez dizajnera, bez tehničkog znanja.", color: "rgba(234,179,8,0.15)" },
          ].map((f) => (
            <div key={f.title} className="card">
              <div style={{ width: 48, height: 48, borderRadius: 12, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: "var(--surface)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div className="badge badge-purple mb-4" style={{ margin: "0 auto 16px" }}>Kako funkcioniše</div>
          <h2 className="landing-section-title" style={{ fontSize: 40, fontWeight: 800, marginBottom: 56 }}>3 koraka do prvog klijenta</h2>
          <div className="grid-3" style={{ gap: 32, textAlign: "left" }}>
            {[
              { n: "01", title: "Kreiraj profil", desc: "Popuni onboarding za 5 minuta. Dodaj projekte, opis i boje koje odgovaraju tebi." },
              { n: "02", title: "Podeli pitch link", desc: "Za svakog klijenta kreiraj personalizovani link sa porukom i relevantnim radovima." },
              { n: "03", title: "Prati i reaguj", desc: "Dobijaš notifikaciju kada otvore. Vidiš šta gledaju. Pišeš im u pravom momentu." },
            ].map((s) => (
              <div key={s.n} className="flex flex-col gap-4">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "white" }}>{s.n}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="badge badge-purple mb-4" style={{ margin: "0 auto 16px" }}>Cene</div>
          <h2 className="landing-section-title" style={{ fontSize: 40, fontWeight: 800 }}>Jednostavne cene</h2>
        </div>
        <div className="grid-2" style={{ gap: 24 }}>
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>FREE</div>
            <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 4 }}>0 din</div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>zauvek besplatno</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {["1 pitch link", "Osnovni profil", "Statistika pregleda"].map(f => (
                <li key={f} className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--text2)" }}>
                  <span style={{ color: "#4ADE80" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn btn-ghost w-full" style={{ justifyContent: "center" }}>Počni besplatno</Link>
          </div>
          <div className="card" style={{
            border: "1.5px solid rgba(124,58,237,0.6)",
            background: "linear-gradient(160deg, rgba(124,58,237,0.13) 0%, rgba(59,130,246,0.06) 100%)",
            position: "relative",
            boxShadow: "0 0 0 1px rgba(124,58,237,0.15), 0 8px 40px rgba(124,58,237,0.22), 0 2px 8px rgba(0,0,0,0.25)",
            overflow: "visible",
          }}>
            {/* Top accent line */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: "linear-gradient(90deg, #7C3AED, #3B82F6, #7C3AED)",
              borderRadius: "12px 12px 0 0",
            }} />
            {/* Badge */}
            <div style={{
              position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
              background: "linear-gradient(90deg, #7C3AED, #6D28D9)",
              color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
              padding: "4px 14px", borderRadius: 999,
              boxShadow: "0 4px 12px rgba(124,58,237,0.5)",
              whiteSpace: "nowrap",
            }}>✦ PREPORUČENO</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#A78BFA", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 10 }}>Pro</div>
            <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 4 }}>990 din<span style={{ fontSize: 16, fontWeight: 500, color: "var(--text2)" }}>/mes</span></div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>otkaži kada hoćeš</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {["Neograničeno pitch linkova", "Sve sekcije profila", "Real-time tracking i notifikacije", "Outreach kit", "Custom boje i fontovi", "Prioritetna podrška"].map(f => (
                <li key={f} className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--text)" }}>
                  <span style={{ color: "#A78BFA", fontSize: 12 }}>✦</span> {f}
                </li>
              ))}
            </ul>
            <CheckoutButton />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--surface)", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 className="landing-section-title" style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Spreman da zatvoriš<br /><span className="grad-text">prvi deal?</span></h2>
          <p style={{ color: "var(--text2)", fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
            Kreiraj pikmi profil za 5 minuta i pošalji prvi personalizovani pitch link još danas.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">Kreiraj profil besplatno →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div className="nav-logo">
          <PikmiLogo size={24} />
          pikmi
        </div>
        <div style={{ fontSize: 13, color: "var(--text3)", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>© 2026 pikmi. Sva prava zadržana.</div>
        <div className="flex gap-4" style={{ fontSize: 13, color: "var(--text3)" }}>
          <Link href="/uslovi" style={{ color: "var(--text3)", textDecoration: "none" }}>Uslovi korišćenja</Link>
          <Link href="/privatnost" style={{ color: "var(--text3)", textDecoration: "none" }}>Politika privatnosti</Link>
        </div>
      </footer>

    </div>
  );
}
