import Link from "next/link";
import PikmiLogo from "../components/PikmiLogo";

export const metadata = { title: "Politika privatnosti — pikmi" };

export default function PrivatnostPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "'Satoshi', -apple-system, sans-serif" }}>

      {/* Nav */}
      <nav className="nav-top">
        <Link href="/" className="nav-logo">
          <PikmiLogo size={32} />
          pikmi
        </Link>
        <div className="nav-actions">
          <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 100px" }}>

        <div style={{ marginBottom: 48 }}>
          <div className="badge badge-purple" style={{ marginBottom: 16, display: "inline-flex" }}>Pravni dokument</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 12 }}>Politika privatnosti</h1>
          <p style={{ fontSize: 15, color: "var(--text2)" }}>Posljednje azuriranje: 20. maja 2026.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

          <Section title="1. Ko smo mi">
            <p>
              pikmi je platforma za kreiranje personalizovanih portfolio profila i pitch linkova,
              dostupna na <strong>pikmi.today</strong>. U ovom dokumentu, "pikmi", "mi" ili "nas"
              odnosi se na tim i kompaniju koja stoji iza ove platforme.
            </p>
            <p>
              Ovom politikom privatnosti objasnjavamo koje podatke prikupljamo, kako ih koristimo
              i na koji nacin ih stitimo.
            </p>
          </Section>

          <Section title="2. Koji podaci se prikupljaju">
            <p><strong>Podaci koje ti dajes:</strong></p>
            <ul>
              <li>Email adresa (pri registraciji)</li>
              <li>Ime i prezime</li>
              <li>Podaci profila: profilna slika, opis usluga, projekti, cijene, tehnologije</li>
              <li>Podaci o placanju (obradjuju se iskljucivo preko Stripe-a — pikmi nema pristup podacima kartice)</li>
            </ul>
            <p><strong>Podaci koji se prikupljaju automatski:</strong></p>
            <ul>
              <li>Podaci o pregledima pitch linkova: datum i vrijeme, tip uredjaja, referrer URL</li>
              <li>IP adresa posjetilaca javnih profila (anonimizovano)</li>
              <li>Podaci o sesiji (ID sesije, user agent) za upravljanje prijavama</li>
            </ul>
          </Section>

          <Section title="3. Kako koristimo podatke">
            <p>Podatke koristimo iskljucivo u svrhe za koje su prikupljeni:</p>
            <ul>
              <li><strong>Pruzanje usluge:</strong> prikaz profila, generisanje linkova, analitika pregleda</li>
              <li><strong>Notifikacije:</strong> slanje email obavjestenja kada neko otvori tvoj pitch link</li>
              <li><strong>Upravljanje pretplatom:</strong> pracenje plana i obracun putem Stripe-a</li>
              <li><strong>Bezbjednost:</strong> ogranicavanje broja aktivnih sesija i detekcija zloupotreba</li>
              <li><strong>Poboljsanje platforme:</strong> anonimizovana analitika koriscenja</li>
            </ul>
            <p>Nikada ne prodajemo tvoje podatke trecim stranama niti ih koristimo u reklamne svrhe.</p>
          </Section>

          <Section title="4. Dijeljenje podataka s trecim stranama">
            <p>Podaci se mogu dijeliti samo sa sljedecim provajderima, u svrhu pruzanja usluge:</p>
            <ul>
              <li><strong>Supabase</strong> — hosting baze podataka i autentifikacija (serveri u EU)</li>
              <li><strong>Stripe</strong> — obrada placanja (ne dobijaju pristup tvojim profilnim podacima)</li>
              <li><strong>Resend</strong> — slanje transakcijskih emailova (notifikacije, reset lozinke)</li>
              <li><strong>Vercel</strong> — hosting platforme</li>
            </ul>
            <p>Svi provajderi su obavezani standardima zastite podataka (GDPR-kompatibilni).</p>
          </Section>

          <Section title="5. Javni profili i pitch linkovi">
            <p>
              Sadrzaj koji postavljas na javni profil (ime, opis, projekti, cijene) je{" "}
              <strong>javno dostupan</strong> svima koji imaju link. Svjestan si toga pri kreiranju profila.
            </p>
            <p>
              Podaci o posjetama pitch linkova (broj pregleda, uredjaj, referrer) vidljivi su tebi
              kao vlasniku linka, ali nisu javno prikazani posjetiocu.
            </p>
          </Section>

          <Section title="6. Kolacici i lokalno skladiste">
            <p>pikmi koristi <strong>localStorage</strong> u browseru za cuvanje:</p>
            <ul>
              <li>Preferencije teme (tamna / svjetla)</li>
              <li>ID aktivne sesije (za upravljanje prijavama na vise uredjaja)</li>
            </ul>
            <p>Ne koristimo tracking kolacice niti alate za pracenje posjetilaca poput Google Analytics-a.</p>
          </Section>

          <Section title="7. Cuvanje i brisanje podataka">
            <p>Podatke cuvamo dok je tvoj nalog aktivan. Imas pravo da:</p>
            <ul>
              <li><strong>Pristupi</strong> svim podacima vezanim za tvoj nalog</li>
              <li><strong>Ispravi</strong> netacne podatke putem podesavanja profila</li>
              <li><strong>Obrises nalog</strong> zajedno sa svim podacima — kontaktiraj nas na email ispod</li>
              <li><strong>Izveze</strong> podatke profila — dostupno na zahtjev</li>
            </ul>
            <p>
              Nakon brisanja naloga, podaci se uklanjaju u roku od 30 dana,
              osim ako postoji zakonska obaveza cuvanja.
            </p>
          </Section>

          <Section title="8. Bezbjednost podataka">
            <p>Koristimo industry-standard mjere zastite:</p>
            <ul>
              <li>HTTPS enkripcija za sve komunikacije</li>
              <li>Lozinke se nikada ne cuvaju u cistom tekstu (Supabase Auth)</li>
              <li>Ogranicenje broja aktivnih sesija po nalogu (max 3 uredjaja)</li>
              <li>Row-level security (RLS) pravila na nivou baze podataka</li>
            </ul>
          </Section>

          <Section title="9. Djeca">
            <p>
              pikmi nije namijenjen osobama mladjim od 16 godina. Svjesno ne prikupljamo podatke
              maloljetnih osoba. Ako smatras da smo greskom prikupili podatke djeteta,
              kontaktiraj nas i odmah cemo obrisati takve podatke.
            </p>
          </Section>

          <Section title="10. Izmjene politike">
            <p>
              Mozemo povremeno azurirati ovu politiku. O znacajnim izmjenama obavijestit cemo te
              emailom ili obavjestenjem na platformi. Preporucujemo povremenu provjeru ove stranice.
            </p>
          </Section>

          <Section title="11. Kontakt">
            <p>Za sva pitanja u vezi privatnosti, brisanja podataka ili ostvarivanja prava, kontaktiraj nas:</p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:podrska@pikmi.today" style={{ color: "var(--purple)" }}>
                podrska@pikmi.today
              </a>
            </p>
            <p>Odgovaramo u roku od 5 radnih dana.</p>
          </Section>

        </div>

        <div style={{
          marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12,
        }}>
          <Link href="/uslovi" style={{ color: "var(--purple)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Uslovi koristenja &rarr;
          </Link>
          <Link href="/" style={{ color: "var(--text3)", fontSize: 14, textDecoration: "none" }}>
            &larr; Nazad na pikmi
          </Link>
        </div>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--text)" }}>{title}</h2>
      <div style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}
