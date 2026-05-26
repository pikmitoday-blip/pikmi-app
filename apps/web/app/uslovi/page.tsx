import Link from "next/link";
import PikmiLogo from "../components/PikmiLogo";

export const metadata = { title: "Uslovi korišćenja — pikmi" };

export default function UsloviPage() {
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

      {/* Sadržaj */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 100px" }}>

        <div style={{ marginBottom: 48 }}>
          <div className="badge badge-purple" style={{ marginBottom: 16, display: "inline-flex" }}>Pravni dokument</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 12 }}>Uslovi korišćenja</h1>
          <p style={{ fontSize: 15, color: "var(--text2)" }}>Posljednje ažuriranje: 20. maja 2026.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

          <Section title="1. Prihvatanje uslova">
            <p>Korišćenjem platforme pikmi (dostupne na <strong>pikmi.today</strong>), potvrđuješ da si pročitao, razumio i da prihvataš ove Uslove korišćenja. Ukoliko se ne slažeš sa uslovima, molimo te da ne koristiš našu platformu.</p>
            <p>Ovi uslovi važe za sve korisnike platforme, uključujući posjetioce, registrovane korisnike i pretplatnike.</p>
          </Section>

          <Section title="2. Opis usluge">
            <p>pikmi je SaaS platforma koja omogućava freelancerima i profesionalcima da kreiraju personalizovane portfolio stranice i pitch linkove, prate aktivnost potencijalnih klijenata i koriste alate za outreach.</p>
            <p>Platforma uključuje sljedeće funkcionalnosti:</p>
            <ul>
              <li>Kreiranje i uređivanje javnog profila</li>
              <li>Generisanje personalizovanih pitch linkova</li>
              <li>Praćenje pregleda i analitiku aktivnosti</li>
              <li>Outreach kit sa šablonima za komunikaciju</li>
              <li>Email notifikacije o aktivnostima</li>
            </ul>
          </Section>

          <Section title="3. Registracija i nalog">
            <p>Da bi koristio pikmi, potrebno je da kreiraš nalog sa validnom email adresom. Odgovoran si za:</p>
            <ul>
              <li>Čuvanje povjerljivosti lozinke naloga</li>
              <li>Sve aktivnosti koje se odvijaju putem tvog naloga</li>
              <li>Tačnost podataka koje unosiš u profil</li>
            </ul>
            <p>Zadržavamo pravo da ukinemo nalog koji krši ove uslove ili koji se duže od 12 meseci ne koristi na besplatnom planu.</p>
          </Section>

          <Section title="4. Planovi i plaćanje">
            <p>pikmi nudi besplatni plan sa ograničenim funkcijama i Pro plan koji se naplaćuje na mjesečnoj ili godišnjoj osnovi.</p>
            <ul>
              <li><strong>Besplatni plan:</strong> Dostupan bez vremenskog ograničenja, bez potrebe za karticom.</li>
              <li><strong>Pro plan:</strong> Naplaćuje se unaprijed. Pretplata se automatski obnavlja na kraju svakog obračunskog perioda.</li>
              <li><strong>Otkazivanje:</strong> Pretplatu možeš otkazati u bilo kom trenutku iz podešavanja naloga. Pristup Pro funkcijama ostaje aktivan do kraja plaćenog perioda.</li>
              <li><strong>Povrat novca:</strong> Nismo u obavezi da vraćamo novac za dijelove perioda koji već teku, osim u slučajevima koji su propisani zakonom.</li>
            </ul>
            <p>Plaćanje se vrši putem Stripe platforme. Pikmi ne čuva podatke o platnoj kartici.</p>
          </Section>

          <Section title="5. Dozvoljeno korišćenje">
            <p>Saglasan si da nećeš koristiti platformu za:</p>
            <ul>
              <li>Objavljivanje lažnih, obmanjujućih ili štetnih sadržaja</li>
              <li>Kršenje prava intelektualne svojine trećih lica</li>
              <li>Slanje neželjene pošte ili obmanjujućih poruka putem outreach alata</li>
              <li>Pokušaje neovlaštenog pristupa sistemu ili tuđim nalozima</li>
              <li>Bilo kakvu nezakonitu aktivnost</li>
            </ul>
          </Section>

          <Section title="6. Sadržaj korisnika">
            <p>Ostavljaš vlasništvo nad sadržajem koji unosiš na platformu (tekst, slike, logoi). Međutim, davanjem sadržaja pikmi platformi, dodjeljuješ nam nevlasničku, neekskluzivnu licencu za prikaz tog sadržaja u okviru pružanja usluge.</p>
            <p>Odgovoran si za sadržaj koji objavljuješ i potvrđuješ da imaš pravo na njegovo korišćenje.</p>
          </Section>

          <Section title="7. Intelektualna svojina">
            <p>Sav softver, dizajn, logotip, tekstovi i ostali elementi pikmi platforme su vlasništvo kompanije pikmi i zaštićeni su autorskim i srodnim pravima. Nije dozvoljeno kopiranje, distribucija ili modifikovanje ovih elemenata bez pisane dozvole.</p>
          </Section>

          <Section title="8. Ograničenje odgovornosti">
            <p>Pikmi platforma se pruža "kakva jeste" bez izričitih ili implicitnih garancija. Ne garantujemo neprekidan pristup usluzi niti odsutnost grešaka.</p>
            <p>U maksimalnoj mjeri dozvoljenoj zakonom, pikmi nije odgovoran za indirektne, slučajne ili posljedične štete nastale korišćenjem ili nemogućnošću korišćenja platforme.</p>
          </Section>

          <Section title="9. Izmene uslova">
            <p>Zadržavamo pravo da izmenimo ove uslove u bilo kom trenutku. O značajnim izmenama obavestićemo te putem email adrese vezane za tvoj nalog ili obaveštenjem na platformi. Nastavak korišćenja platforme nakon objave izmena smatra se prihvatanjem novih uslova.</p>
          </Section>

          <Section title="10. Mjerodavno pravo i kontakt">
            <p>Na ove uslove primjenjuje se pravo Bosne i Hercegovine. Za sva pitanja u vezi uslova korišćenja, možeš nas kontaktirati na:</p>
            <p><strong>Email:</strong> <a href="mailto:podrska@pikmi.today" style={{ color: "var(--purple)" }}>podrska@pikmi.today</a></p>
          </Section>

        </div>

        <div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Link href="/privatnost" style={{ color: "var(--purple)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Politika privatnosti →
          </Link>
          <Link href="/" style={{ color: "var(--text3)", fontSize: 14, textDecoration: "none" }}>
            ← Nazad na pikmi
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
      <div style={{
        fontSize: 15, color: "var(--text2)", lineHeight: 1.8,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {children}
      </div>
    </div>
  );
}
