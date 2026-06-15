// ─── Professions + per-profession placeholder content ───────────────────────
// Used by onboarding (step 1 dropdown) and to pre-fill the live portfolio with
// realistic example content the user can edit.

export interface ProfessionPlaceholder {
  serviceTitle: string;
  serviceDesc: string;
  pricing: { name: string; price: string; desc: string }[];
  skills: string[];
  experience: { company: string; role: string; desc: string }[]; // → caseStudies
  testimonial: { quote: string; name: string; title: string };
}

export const PROFESSIONS: string[] = [
  "UGC kreator",
  "Content kreator",
  "Dizajner",
  "Video editor",
  "SMM menadžer",
  "Copywriter",
  "Fotograf",
  "Web developer",
  "Videograf",
  "Performance marketar",
  "Appointment setter",
  "Social media menadžer",
  "Brand dizajner",
  "Motion dizajner",
  "Email marketar",
  "Virtuelni asistent",
  "Ostalo",
];

const P = (
  serviceTitle: string, serviceDesc: string,
  pricing: { name: string; price: string; desc: string }[],
  skills: string[],
  experience: { company: string; role: string; desc: string }[],
  testimonial: { quote: string; name: string; title: string },
): ProfessionPlaceholder => ({ serviceTitle, serviceDesc, pricing, skills, experience, testimonial });

export const PLACEHOLDERS: Record<string, ProfessionPlaceholder> = {
  "UGC kreator": P(
    "UGC sadržaj za Meta i TikTok",
    "Pravim autentičan video sadržaj koji brendovima povećava prodaju, angažovanje i poverenje kupaca.",
    [
      { name: "Starter", price: "€300", desc: "2 UGC videa, pisanje skripti, snimanje i montaža." },
      { name: "Growth", price: "€500", desc: "4 UGC videa, po 3 hooka, montaža i revizije." },
    ],
    ["UGC", "TikTok", "Instagram Reels", "Pisanje skripti", "Video montaža"],
    [{ company: "Lumea Beauty", role: "UGC kreator", desc: "Serija UGC videa koja je podigla prodaju za 40% u 2 meseca." }],
    { quote: "Sadržaj izgleda potpuno prirodno, a donosi odlične rezultate. Najbolja saradnja do sada.", name: "Jelena Stojanović", title: "Marketing Manager, Lumea" },
  ),
  "Content kreator": P(
    "Kreiranje sadržaja za društvene mreže",
    "Osmišljavam i pravim sadržaj koji gradi zajednicu i pretvara pratioce u kupce.",
    [
      { name: "Mesečni", price: "€400", desc: "12 objava + 8 reels-a mesečno, sa planom sadržaja." },
      { name: "Premium", price: "€700", desc: "20 objava, 12 reels-a, stories i mesečni izveštaj." },
    ],
    ["Content strategija", "Reels", "Storytelling", "Copywriting", "Canva"],
    [{ company: "FitZone", role: "Content kreator", desc: "Vodio nalog do 50k pratilaca za 6 meseci." }],
    { quote: "Konačno sadržaj koji ljudi gledaju do kraja i komentarišu. Engagement nam je porastao 3×.", name: "Marko Petrović", title: "Osnivač, FitZone" },
  ),
  "Dizajner": P(
    "Grafički dizajn za brendove koji žele da se izdvoje",
    "Kreiram vizuelni identitet, social media dizajn i marketinške materijale koji izgledaju profesionalno i privlače prave klijente.",
    [
      { name: "Starter", price: "€250", desc: "Logo + paleta boja + 2 varijacije, font pairing." },
      { name: "Full Brand", price: "€600", desc: "Logo, boje, fontovi, social šabloni i brand book." },
    ],
    ["Figma", "Adobe Illustrator", "Photoshop", "Brand identity", "Tipografija"],
    [{ company: "Bloom Studio", role: "Brend dizajn", desc: "Kompletan vizuelni identitet za boutique brend." }],
    { quote: "Pogodila je naš vizuelni identitet iz prve. Profesionalna, brza i ima oko za detalje.", name: "Tamara Ristić", title: "Vlasnica, Bloom Studio" },
  ),
  "Video editor": P(
    "Video montaža za brendove i kreatore",
    "Montiram video sadržaj koji zadržava pažnju, podiže engagement i pretvara gledaoce u kupce — za YouTube, Instagram i TikTok.",
    [
      { name: "Basic", price: "€200", desc: "Montaža videa do 60s, color grading, titlovi, muzika." },
      { name: "Pro", price: "€450", desc: "3 videa mesečno, motion grafika, zvuk, 2 revizije." },
    ],
    ["Premiere Pro", "After Effects", "DaVinci Resolve", "Color grading", "Sound design"],
    [{ company: "NovaTech", role: "Video editor", desc: "Mesečna montaža 8+ videa, retention porastao 40%." }],
    { quote: "Brz, precizan, i svaki video izgleda kao da ga je radio ceo tim. Preporuka svima.", name: "Nikola Đorđević", title: "Marketing Director, NovaTech" },
  ),
  "SMM menadžer": P(
    "Vođenje društvenih mreža od A do Š",
    "Vodim kompletne naloge na društvenim mrežama — strategija, sadržaj, zajednica i izveštaji koji pokazuju rast.",
    [
      { name: "Standard", price: "€450", desc: "2 mreže, plan sadržaja, objave i community management." },
      { name: "Premium", price: "€800", desc: "3 mreže, sadržaj, oglasi i mesečni izveštaj." },
    ],
    ["Social strategija", "Community management", "Meta Ads", "Analitika", "Planiranje sadržaja"],
    [{ company: "Aura Cosmetics", role: "SMM menadžer", desc: "Porast pratilaca 2× i 35% više upita za 4 meseca." }],
    { quote: "Preuzela je naše mreže i konačno imamo jasnu strategiju i rezultate. Mirni smo.", name: "Ana Jovanović", title: "Brand Manager, Aura" },
  ),
  "Copywriter": P(
    "Copywriting koji prodaje",
    "Pišem tekstove za landing strane, email kampanje i oglase koji pretvaraju čitaoce u kupce.",
    [
      { name: "Sales copy", price: "€200", desc: "Prodajni tekst za landing stranu ili oglas." },
      { name: "Email paket", price: "€450", desc: "Email sekvenca od 5 mejlova + strategija." },
    ],
    ["Copywriting", "Email marketing", "SEO", "Brand voice", "Storytelling"],
    [{ company: "Glovo", role: "Copywriter", desc: "Prepisao landing — konverzija porasla za 28%." }],
    { quote: "Tekstovi konačno zvuče kao mi i prodaju. Konverzija nam je primetno skočila.", name: "Stefan Ilić", title: "Growth Lead, Glovo" },
  ),
  "Fotograf": P(
    "Fotografija proizvoda i brendova",
    "Snimam proizvode i brendove sa stilom — studio i lifestyle fotografija koja prodaje.",
    [
      { name: "Mini", price: "€180", desc: "10 profesionalno obrađenih fotografija." },
      { name: "Full", price: "€500", desc: "30 fotografija + lifestyle setovi + napredni retuš." },
    ],
    ["Product fotografija", "Lifestyle", "Studio", "Retuširanje", "Lightroom"],
    [{ company: "Senka Jewelry", role: "Fotograf", desc: "Kompletna produkt sesija za novu kolekciju." }],
    { quote: "Fotke su podigle ceo brend na viši nivo. Profesionalno od početka do kraja.", name: "Milica Vujić", title: "Osnivačica, Senka" },
  ),
  "Web developer": P(
    "Web development za startape i agencije",
    "Gradim brze, moderne sajtove i web aplikacije koje pretvaraju posetioce u klijente.",
    [
      { name: "Landing", price: "€400", desc: "Responsive one-page sajt, do 5 sekcija, optimizovan." },
      { name: "Web app", price: "€1200", desc: "Full-stack aplikacija, integracije i deploy." },
    ],
    ["Next.js", "React", "Node.js", "TypeScript", "Figma"],
    [{ company: "ShopLab", role: "Web developer", desc: "Razvio e-commerce sajt sa 99 Lighthouse skorom." }],
    { quote: "Sajt je brz, lep i radi besprekorno. Komunikacija i rokovi na nivou.", name: "Vladimir Marić", title: "CTO, ShopLab" },
  ),
  "Videograf": P(
    "Snimanje i produkcija video sadržaja",
    "Snimam i produciram video sadržaj — od ideje i scenarija do finalne montaže.",
    [
      { name: "Spot", price: "€600", desc: "30s reklama: scenario, snimanje i montaža." },
      { name: "Film", price: "€1500", desc: "Kompletna produkcija + post-produkcija." },
    ],
    ["Snimanje", "Premiere Pro", "DaVinci Resolve", "Color grading", "Drone"],
    [{ company: "Red Bull Srbija", role: "Videograf", desc: "Event recap video za seriju događaja." }],
    { quote: "Profesionalna ekipa, vrhunski kvalitet snimka i montaže. Svaka preporuka.", name: "Nemanja Kostić", title: "Event Manager, Red Bull" },
  ),
  "Performance marketar": P(
    "Performance oglasi za skaliranje prodaje",
    "Vodim i optimizujem Meta i Google oglase koji donose merljiv ROAS i rast prodaje.",
    [
      { name: "Audit", price: "€300", desc: "Analiza naloga + strategija i 30-dnevni plan." },
      { name: "Management", price: "€800", desc: "Vođenje kampanja, kreativna optimizacija, izveštaji." },
    ],
    ["Meta Ads", "Google Ads", "TikTok Ads", "Analitika", "CRO"],
    [{ company: "Velora", role: "Performance marketar", desc: "Skalirao ad spend 4× uz bolji ROAS za 3 meseca." }],
    { quote: "Za 3 meseca smo udvostručili prodaju uz isti budžet. Brojke govore sve.", name: "Ivana Lukić", title: "Osnivačica, Velora" },
  ),
  "Appointment setter": P(
    "Zakazivanje sastanaka za B2B timove",
    "Popunjavam kalendar prodajnog tima kvalifikovanim sastancima kroz outreach i follow-up.",
    [
      { name: "Starter", price: "€350", desc: "Outreach na 300 leadova mesečno + zakazivanje." },
      { name: "Pro", price: "€700", desc: "600 leadova, follow-up sekvence i CRM vođenje." },
    ],
    ["Cold outreach", "LinkedIn", "Email", "CRM", "Follow-up"],
    [{ company: "Orbit Agency", role: "Appointment setter", desc: "Zakazao 40+ kvalifikovanih poziva mesečno." }],
    { quote: "Kalendar nam je pun kvalitetnih poziva. Prodaja samo treba da zatvori.", name: "Đorđe Pavlović", title: "Sales Lead, Orbit" },
  ),
  "Social media menadžer": P(
    "Upravljanje društvenim mrežama i zajednicom",
    "Vodim naloge, planiram sadržaj i gradim aktivnu zajednicu oko brenda.",
    [
      { name: "Standard", price: "€400", desc: "Plan sadržaja, objave i community management za 2 mreže." },
      { name: "Premium", price: "€750", desc: "3 mreže, sadržaj, stories i mesečni izveštaj." },
    ],
    ["Planiranje sadržaja", "Community management", "Copywriting", "Canva", "Analitika"],
    [{ company: "Mliva", role: "Social media menadžer", desc: "Povećao engagement 3× za 5 meseci." }],
    { quote: "Naše mreže su konačno žive i dosledne. Pratioci rastu svake nedelje.", name: "Sara Nikolić", title: "Marketing, Mliva" },
  ),
  "Brand dizajner": P(
    "Brendiranje koje se pamti",
    "Gradim kompletan vizuelni identitet — logo, boje, tipografiju i brand guidelines.",
    [
      { name: "Logo paket", price: "€350", desc: "Logo, paleta, fontovi i 2 varijacije." },
      { name: "Brand identitet", price: "€900", desc: "Kompletan identitet + brand book + social šabloni." },
    ],
    ["Brand identity", "Logo dizajn", "Tipografija", "Illustrator", "Brand strategija"],
    [{ company: "Polje", role: "Brand dizajner", desc: "Kompletan rebranding za eko brend hrane." }],
    { quote: "Naš brend sada izgleda kao da iza njega stoji velika agencija. Oduševljeni smo.", name: "Jovan Simić", title: "Osnivač, Polje" },
  ),
  "Motion dizajner": P(
    "Motion grafika i animacija",
    "Pravim animacije i motion grafiku koje oživljavaju brend i objašnjavaju proizvod.",
    [
      { name: "Animacija", price: "€300", desc: "Animirani logo ili kratka motion sekvenca." },
      { name: "Explainer", price: "€800", desc: "Explainer video do 60s sa scenarijem i zvukom." },
    ],
    ["After Effects", "Motion grafika", "2D animacija", "Cinema 4D", "Sound design"],
    [{ company: "Echo App", role: "Motion dizajner", desc: "Explainer video koji je podigao konverziju na sajtu." }],
    { quote: "Animacija je tačno prenela poruku. Profesionalno i tačno na vreme.", name: "Luka Janković", title: "Product, Echo" },
  ),
  "Email marketar": P(
    "Email marketing koji vraća kupce",
    "Postavljam i vodim email tokove i kampanje koje donose prihod na autopilotu.",
    [
      { name: "Setup", price: "€350", desc: "Postavka 3 automatska toka (welcome, cart, post-purchase)." },
      { name: "Management", price: "€600", desc: "Mesečne kampanje, segmentacija i A/B testovi." },
    ],
    ["Klaviyo", "Email automatizacija", "Copywriting", "Segmentacija", "A/B testiranje"],
    [{ company: "Bassiq", role: "Email marketar", desc: "Email kanal donosi 30% mesečnog prihoda." }],
    { quote: "Email nam je postao najjači kanal prodaje. Sve radi samo od sebe.", name: "Maja Todorović", title: "E-commerce Lead, Bassiq" },
  ),
  "Virtuelni asistent": P(
    "Virtuelna podrška koja oslobađa tvoje vreme",
    "Preuzimam administraciju, organizaciju i operativne zadatke da se ti baviš rastom biznisa.",
    [
      { name: "Part-time", price: "€300", desc: "20h mesečno: email, kalendar i administracija." },
      { name: "Full support", price: "€600", desc: "40h mesečno: operativa, podrška i koordinacija." },
    ],
    ["Organizacija", "Email management", "Kalendar", "Notion", "Korisnička podrška"],
    [{ company: "Surreal Studio", role: "Virtuelni asistent", desc: "Preuzela administraciju i operativu za tim od 5 ljudi." }],
    { quote: "Oslobodila mi je sate svake nedelje. Pouzdana i organizovana — ne mogu bez nje.", name: "Petar Aleksić", title: "Osnivač, Surreal" },
  ),
  "Ostalo": P(
    "Opiši čime se baviš",
    "Opiši u 1–2 rečenice čime se baviš i kakvu vrednost donosiš svojim klijentima.",
    [
      { name: "Paket 1", price: "€___", desc: "Opiši šta je uključeno u ovaj paket." },
      { name: "Paket 2", price: "€___", desc: "Opiši šta je uključeno u ovaj paket." },
    ],
    ["Veština 1", "Veština 2", "Veština 3"],
    [{ company: "Naziv klijenta", role: "Tvoja uloga", desc: "Opiši rezultat koji si postigao za klijenta." }],
    { quote: "Dodaj recenziju zadovoljnog klijenta koja gradi poverenje.", name: "Ime klijenta", title: "Pozicija, Kompanija" },
  ),
};

export function getPlaceholders(profession?: string): ProfessionPlaceholder {
  return (profession && PLACEHOLDERS[profession]) || PLACEHOLDERS["Ostalo"];
}
