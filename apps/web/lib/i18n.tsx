"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Locale = "sr" | "hr" | "en";

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "sr", label: "Srpski",   flag: "🇷🇸" },
  { value: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { value: "en", label: "English",  flag: "🇬🇧" },
];

// ─── Translations ────────────────────────────────────────────────────────────

const translations = {
  sr: {
    // Nav
    nav_dashboard:    "Dashboard",
    nav_my_profile:   "Moj profil",
    nav_pitch_links:  "Pitch linkovi",
    nav_analytics:    "Analitika",
    nav_edit_profile: "Uredi profil",
    nav_outreach:     "Outreach kit",
    nav_billing:      "Naplata",
    nav_admin:        "Admin panel",
    nav_logout:       "Odjava",
    // Sidebar
    navigation:       "Navigacija",
    dark_theme:       "Tamna tema",
    light_theme:      "Svetla tema",
    free_plan:        "free plan",
    pro_plan:         "pro plan",
    language:         "Jezik",
    // Mobile nav
    mob_home:         "Home",
    mob_profile:      "Profil",
    mob_links:        "Linkovi",
    mob_analytics:    "Analitika",
    mob_outreach:     "Outreach",
    // Loading
    loading:          "Učitavanje...",
    // Dashboard
    dash_title:       "Dashboard",
    dash_subtitle:    "Pregled tvojih aktivnosti",
    dash_welcome:     "Dobrodošao nazad",
    dash_views:       "pregleda",
    dash_links:       "aktivnih linkova",
    dash_trial_left:  "dana triala",
    dash_upgrade:     "Nadogradi na Pro",
    dash_create_link: "Kreiraj pitch link",
    dash_no_links:    "Nemaš još ni jedan pitch link.",
    dash_create_first:"Kreiraj prvi →",
    // Profile
    profile_title:    "Moj profil",
    profile_subtitle: "Pregled i uređivanje profila",
    profile_view:     "Pogledaj profil",
    profile_edit:     "Uredi",
    profile_save:     "Sačuvaj",
    profile_cancel:   "Otkaži",
    profile_saved:    "Sačuvano ✓",
    profile_saving:   "Čuvanje...",
    // Pitch links
    links_title:      "Pitch linkovi",
    links_subtitle:   "Upravljaj pitch linkovima",
    links_create:     "Novi link",
    links_copy:       "Kopiraj",
    links_copied:     "Kopirano!",
    links_delete:     "Obriši",
    links_views:      "pregleda",
    links_empty:      "Nemaš još ni jedan pitch link.",
    links_client:     "Ime klijenta",
    links_slug:       "URL adresa",
    links_note:       "Napomena",
    links_create_btn: "Kreiraj link",
    links_creating:   "Kreiranje...",
    // Analytics
    analytics_title:  "Analitika",
    analytics_subtitle:"Statistika pregleda tvojih linkova",
    analytics_all_links:"Svi linkovi",
    analytics_total:  "Ukupno pregleda",
    analytics_unique: "Jedinstveni pregledi",
    analytics_avg:    "Prosek dnevno",
    analytics_best:   "Najaktivniji dan",
    // Billing
    billing_title:    "Naplata",
    billing_subtitle: "Upravljaj pretplatom i planom",
    billing_pro:      "Pro plan",
    billing_free:     "Free plan",
    billing_current:  "Tvoj trenutni plan",
    billing_subscribe:"Pretplati se na Pro →",
    billing_subscribing:"Preusmjeravam...",
    billing_cancel:   "Otkaži pretplatu",
    billing_cancelling:"Otkazivanje...",
    billing_manage:   "Promeni način plaćanja",
    billing_loading:  "Učitavanje...",
    billing_success:  "🎉 Uspešno! Tvoj Pro plan je aktiviran.",
    billing_cancelled:"Plaćanje je otkazano. Možeš pokušati ponovo u bilo kom trenutku.",
    billing_payment_updated: "✓ Način plaćanja je uspješno ažuriran.",
    billing_expires:  "⚠ Pretplata ističe",
    billing_details:  "Detalji pretplate",
    billing_next:     "Sledeća naplata",
    billing_expires_on:"⚠ Ističe",
    billing_amount:   "Iznos pretplate",
    billing_status:   "Status",
    billing_active:   "✓ Aktivna",
    billing_card:     "Kartica",
    billing_card_exp: "Ističe",
    billing_invoice:  "Poslednja faktura",
    billing_pdf:      "Preuzmi PDF ↗",
    billing_faq:      "Česta pitanja",
    billing_keep_pro: "Zadrži Pro",
    billing_confirm_cancel: "Otkaži Pro pretplatu?",
    billing_confirm_text: "Zadržaćeš pristup svim Pro funkcijama do kraja trenutnog obračunskog perioda.",
    billing_confirm_after: "Nakon isteka, nalog se automatski prebacuje na Free plan.",
    billing_yes_cancel: "Da, otkaži",
    billing_access_all: "Imaš pristup svim funkcijama",
    billing_trial_days: "dana",
    billing_trial_expires: "Trial ističe za",
    billing_trial_expired: "Trial istekao — nadogradi na Pro",
    // Outreach
    outreach_title:   "Outreach kit",
    outreach_subtitle:"Šabloni za akviziciju klijenata",
    outreach_pro_only:"Outreach kit je dostupan samo Pro korisnicima.",
    outreach_upgrade: "Nadogradi na Pro",
    // Auth
    auth_login:       "Prijavi se",
    auth_register:    "Registruj se",
    auth_logout:      "Odjavi se",
    auth_email:       "Email adresa",
    auth_password:    "Lozinka",
    auth_forgot:      "Zaboravljena lozinka?",
    auth_no_account:  "Nemaš nalog?",
    auth_have_account:"Već imaš nalog?",
    // Common
    save:             "Sačuvaj",
    cancel:           "Otkaži",
    delete:           "Obriši",
    edit:             "Uredi",
    create:           "Kreiraj",
    confirm:          "Potvrdi",
    back:             "Nazad",
    yes:              "Da",
    no:               "Ne",
    error:            "Greška",
    success:          "Uspešno",
    months_per:       "/mes",
    forever_free:     "zauvek besplatno",
    cancel_anytime:   "Otkaži u bilo kom trenutku",
  },

  hr: {
    // Nav
    nav_dashboard:    "Dashboard",
    nav_my_profile:   "Moj profil",
    nav_pitch_links:  "Pitch linkovi",
    nav_analytics:    "Analitika",
    nav_edit_profile: "Uredi profil",
    nav_outreach:     "Outreach kit",
    nav_billing:      "Naplata",
    nav_admin:        "Admin panel",
    nav_logout:       "Odjava",
    // Sidebar
    navigation:       "Navigacija",
    dark_theme:       "Tamna tema",
    light_theme:      "Svijetla tema",
    free_plan:        "free plan",
    pro_plan:         "pro plan",
    language:         "Jezik",
    // Mobile nav
    mob_home:         "Početna",
    mob_profile:      "Profil",
    mob_links:        "Linkovi",
    mob_analytics:    "Analitika",
    mob_outreach:     "Outreach",
    // Loading
    loading:          "Učitavanje...",
    // Dashboard
    dash_title:       "Dashboard",
    dash_subtitle:    "Pregled tvojih aktivnosti",
    dash_welcome:     "Dobrodošao natrag",
    dash_views:       "pregleda",
    dash_links:       "aktivnih linkova",
    dash_trial_left:  "dana triala",
    dash_upgrade:     "Nadogradi na Pro",
    dash_create_link: "Kreiraj pitch link",
    dash_no_links:    "Nemaš još ni jedan pitch link.",
    dash_create_first:"Kreiraj prvi →",
    // Profile
    profile_title:    "Moj profil",
    profile_subtitle: "Pregled i uređivanje profila",
    profile_view:     "Pogledaj profil",
    profile_edit:     "Uredi",
    profile_save:     "Spremi",
    profile_cancel:   "Odustani",
    profile_saved:    "Spremljeno ✓",
    profile_saving:   "Spremanje...",
    // Pitch links
    links_title:      "Pitch linkovi",
    links_subtitle:   "Upravljaj pitch linkovima",
    links_create:     "Novi link",
    links_copy:       "Kopiraj",
    links_copied:     "Kopirano!",
    links_delete:     "Obriši",
    links_views:      "pregleda",
    links_empty:      "Nemaš još ni jedan pitch link.",
    links_client:     "Ime klijenta",
    links_slug:       "URL adresa",
    links_note:       "Napomena",
    links_create_btn: "Kreiraj link",
    links_creating:   "Kreiranje...",
    // Analytics
    analytics_title:  "Analitika",
    analytics_subtitle:"Statistika pregleda tvojih linkova",
    analytics_all_links:"Svi linkovi",
    analytics_total:  "Ukupno pregleda",
    analytics_unique: "Jedinstveni pregledi",
    analytics_avg:    "Prosjek dnevno",
    analytics_best:   "Najaktivniji dan",
    // Billing
    billing_title:    "Naplata",
    billing_subtitle: "Upravljaj pretplatom i planom",
    billing_pro:      "Pro plan",
    billing_free:     "Free plan",
    billing_current:  "Tvoj trenutni plan",
    billing_subscribe:"Pretplati se na Pro →",
    billing_subscribing:"Preusmjeravamo...",
    billing_cancel:   "Otkaži pretplatu",
    billing_cancelling:"Otkazivanje...",
    billing_manage:   "Promijeni način plaćanja",
    billing_loading:  "Učitavanje...",
    billing_success:  "🎉 Uspješno! Tvoj Pro plan je aktiviran.",
    billing_cancelled:"Plaćanje je otkazano. Možeš pokušati ponovo u bilo kojem trenutku.",
    billing_payment_updated: "✓ Način plaćanja je uspješno ažuriran.",
    billing_expires:  "⚠ Pretplata ističe",
    billing_details:  "Detalji pretplate",
    billing_next:     "Sljedeća naplata",
    billing_expires_on:"⚠ Ističe",
    billing_amount:   "Iznos pretplate",
    billing_status:   "Status",
    billing_active:   "✓ Aktivna",
    billing_card:     "Kartica",
    billing_card_exp: "Ističe",
    billing_invoice:  "Posljednji račun",
    billing_pdf:      "Preuzmi PDF ↗",
    billing_faq:      "Česta pitanja",
    billing_keep_pro: "Zadrži Pro",
    billing_confirm_cancel: "Otkaži Pro pretplatu?",
    billing_confirm_text: "Zadržat ćeš pristup svim Pro funkcijama do kraja trenutnog obračunskog razdoblja.",
    billing_confirm_after: "Nakon isteka, račun se automatski prebacuje na Free plan.",
    billing_yes_cancel: "Da, otkaži",
    billing_access_all: "Imaš pristup svim funkcijama",
    billing_trial_days: "dana",
    billing_trial_expires: "Trial ističe za",
    billing_trial_expired: "Trial istekao — nadogradi na Pro",
    // Outreach
    outreach_title:   "Outreach kit",
    outreach_subtitle:"Predlošci za akviziciju klijenata",
    outreach_pro_only:"Outreach kit je dostupan samo Pro korisnicima.",
    outreach_upgrade: "Nadogradi na Pro",
    // Auth
    auth_login:       "Prijavi se",
    auth_register:    "Registriraj se",
    auth_logout:      "Odjavi se",
    auth_email:       "Email adresa",
    auth_password:    "Lozinka",
    auth_forgot:      "Zaboravljena lozinka?",
    auth_no_account:  "Nemaš račun?",
    auth_have_account:"Već imaš račun?",
    // Common
    save:             "Spremi",
    cancel:           "Odustani",
    delete:           "Obriši",
    edit:             "Uredi",
    create:           "Kreiraj",
    confirm:          "Potvrdi",
    back:             "Natrag",
    yes:              "Da",
    no:               "Ne",
    error:            "Greška",
    success:          "Uspješno",
    months_per:       "/mjes",
    forever_free:     "zauvijek besplatno",
    cancel_anytime:   "Otkaži u bilo kojem trenutku",
  },

  en: {
    // Nav
    nav_dashboard:    "Dashboard",
    nav_my_profile:   "My Profile",
    nav_pitch_links:  "Pitch Links",
    nav_analytics:    "Analytics",
    nav_edit_profile: "Edit Profile",
    nav_outreach:     "Outreach Kit",
    nav_billing:      "Billing",
    nav_admin:        "Admin Panel",
    nav_logout:       "Logout",
    // Sidebar
    navigation:       "Navigation",
    dark_theme:       "Dark mode",
    light_theme:      "Light mode",
    free_plan:        "free plan",
    pro_plan:         "pro plan",
    language:         "Language",
    // Mobile nav
    mob_home:         "Home",
    mob_profile:      "Profile",
    mob_links:        "Links",
    mob_analytics:    "Analytics",
    mob_outreach:     "Outreach",
    // Loading
    loading:          "Loading...",
    // Dashboard
    dash_title:       "Dashboard",
    dash_subtitle:    "Overview of your activity",
    dash_welcome:     "Welcome back",
    dash_views:       "views",
    dash_links:       "active links",
    dash_trial_left:  "trial days left",
    dash_upgrade:     "Upgrade to Pro",
    dash_create_link: "Create pitch link",
    dash_no_links:    "You don't have any pitch links yet.",
    dash_create_first:"Create your first →",
    // Profile
    profile_title:    "My Profile",
    profile_subtitle: "View and edit your profile",
    profile_view:     "View Profile",
    profile_edit:     "Edit",
    profile_save:     "Save",
    profile_cancel:   "Cancel",
    profile_saved:    "Saved ✓",
    profile_saving:   "Saving...",
    // Pitch links
    links_title:      "Pitch Links",
    links_subtitle:   "Manage your pitch links",
    links_create:     "New link",
    links_copy:       "Copy",
    links_copied:     "Copied!",
    links_delete:     "Delete",
    links_views:      "views",
    links_empty:      "You don't have any pitch links yet.",
    links_client:     "Client name",
    links_slug:       "URL slug",
    links_note:       "Note",
    links_create_btn: "Create link",
    links_creating:   "Creating...",
    // Analytics
    analytics_title:  "Analytics",
    analytics_subtitle:"View statistics for your pitch links",
    analytics_all_links:"All links",
    analytics_total:  "Total views",
    analytics_unique: "Unique views",
    analytics_avg:    "Daily average",
    analytics_best:   "Most active day",
    // Billing
    billing_title:    "Billing",
    billing_subtitle: "Manage your subscription and plan",
    billing_pro:      "Pro plan",
    billing_free:     "Free plan",
    billing_current:  "Your current plan",
    billing_subscribe:"Subscribe to Pro →",
    billing_subscribing:"Redirecting...",
    billing_cancel:   "Cancel subscription",
    billing_cancelling:"Cancelling...",
    billing_manage:   "Update payment method",
    billing_loading:  "Loading...",
    billing_success:  "🎉 Success! Your Pro plan is now active.",
    billing_cancelled:"Payment cancelled. You can try again at any time.",
    billing_payment_updated: "✓ Payment method successfully updated.",
    billing_expires:  "⚠ Subscription expires",
    billing_details:  "Subscription details",
    billing_next:     "Next billing date",
    billing_expires_on:"⚠ Expires",
    billing_amount:   "Subscription amount",
    billing_status:   "Status",
    billing_active:   "✓ Active",
    billing_card:     "Card",
    billing_card_exp: "Expires",
    billing_invoice:  "Last invoice",
    billing_pdf:      "Download PDF ↗",
    billing_faq:      "FAQ",
    billing_keep_pro: "Keep Pro",
    billing_confirm_cancel: "Cancel Pro subscription?",
    billing_confirm_text: "You'll keep access to all Pro features until the end of the current billing period.",
    billing_confirm_after: "After expiry, your account automatically switches to the Free plan.",
    billing_yes_cancel: "Yes, cancel",
    billing_access_all: "You have access to all features",
    billing_trial_days: "days",
    billing_trial_expires: "Trial expires in",
    billing_trial_expired: "Trial expired — upgrade to Pro",
    // Outreach
    outreach_title:   "Outreach Kit",
    outreach_subtitle:"Templates for client acquisition",
    outreach_pro_only:"Outreach Kit is available for Pro users only.",
    outreach_upgrade: "Upgrade to Pro",
    // Auth
    auth_login:       "Sign in",
    auth_register:    "Sign up",
    auth_logout:      "Sign out",
    auth_email:       "Email address",
    auth_password:    "Password",
    auth_forgot:      "Forgot password?",
    auth_no_account:  "Don't have an account?",
    auth_have_account:"Already have an account?",
    // Common
    save:             "Save",
    cancel:           "Cancel",
    delete:           "Delete",
    edit:             "Edit",
    create:           "Create",
    confirm:          "Confirm",
    back:             "Back",
    yes:              "Yes",
    no:               "No",
    error:            "Error",
    success:          "Success",
    months_per:       "/mo",
    forever_free:     "free forever",
    cancel_anytime:   "Cancel anytime",
  },
} as const;

export type TranslationKey = keyof typeof translations.sr;

// ─── Context ─────────────────────────────────────────────────────────────────

interface LangContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
  locale: "sr",
  setLocale: () => {},
  t: (key) => translations.sr[key] ?? key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("sr");

  useEffect(() => {
    const saved = localStorage.getItem("pikmi-lang") as Locale | null;
    if (saved && ["sr", "hr", "en"].includes(saved)) setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("pikmi-lang", l);
  }

  function t(key: TranslationKey): string {
    return (translations[locale] as Record<string, string>)[key]
      ?? (translations.sr as Record<string, string>)[key]
      ?? key;
  }

  return (
    <LangContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}
