"use client";
import { useSyncExternalStore } from "react";

export type Locale = "sr" | "hr" | "en";

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "sr", label: "Srpski",   flag: "🇷🇸" },
  { value: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { value: "en", label: "English",  flag: "🇬🇧" },
];

// ─── Global store (bypasses React context tree issues) ────────────────────────

let _locale: Locale = "sr";
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach(fn => fn());
}

export function setLocale(l: Locale) {
  _locale = l;
  if (typeof window !== "undefined") localStorage.setItem("pikmi-lang", l);
  _notify();
}

export function getLocale(): Locale {
  return _locale;
}

// ─── Translations ────────────────────────────────────────────────────────────

const translations = {
  sr: {
    nav_dashboard:    "Dashboard",
    nav_my_profile:   "Moj profil",
    nav_pitch_links:  "Pitch linkovi",
    nav_analytics:    "Analitika",
    nav_edit_profile: "Uredi profil",
    nav_outreach:     "Outreach kit",
    nav_billing:      "Naplata",
    nav_admin:        "Admin panel",
    nav_logout:       "Odjava",
    navigation:       "Navigacija",
    dark_theme:       "Tamna tema",
    light_theme:      "Svetla tema",
    free_plan:        "free plan",
    pro_plan:         "pro plan",
    language:         "Jezik",
    mob_home:         "Home",
    mob_profile:      "Profil",
    mob_links:        "Linkovi",
    mob_analytics:    "Analitika",
    mob_outreach:     "Outreach",
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
    // Common
    save:             "Sačuvaj",
    cancel:           "Otkaži",
    months_per:       "/mes",
    forever_free:     "zauvek besplatno",
    cancel_anytime:   "Otkaži u bilo kom trenutku",
  },

  hr: {
    nav_dashboard:    "Dashboard",
    nav_my_profile:   "Moj profil",
    nav_pitch_links:  "Pitch linkovi",
    nav_analytics:    "Analitika",
    nav_edit_profile: "Uredi profil",
    nav_outreach:     "Outreach kit",
    nav_billing:      "Naplata",
    nav_admin:        "Admin panel",
    nav_logout:       "Odjava",
    navigation:       "Navigacija",
    dark_theme:       "Tamna tema",
    light_theme:      "Svijetla tema",
    free_plan:        "free plan",
    pro_plan:         "pro plan",
    language:         "Jezik",
    mob_home:         "Početna",
    mob_profile:      "Profil",
    mob_links:        "Linkovi",
    mob_analytics:    "Analitika",
    mob_outreach:     "Outreach",
    loading:          "Učitavanje...",
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
    save:             "Spremi",
    cancel:           "Odustani",
    months_per:       "/mjes",
    forever_free:     "zauvijek besplatno",
    cancel_anytime:   "Otkaži u bilo kojem trenutku",
  },

  en: {
    nav_dashboard:    "Dashboard",
    nav_my_profile:   "My Profile",
    nav_pitch_links:  "Pitch Links",
    nav_analytics:    "Analytics",
    nav_edit_profile: "Edit Profile",
    nav_outreach:     "Outreach Kit",
    nav_billing:      "Billing",
    nav_admin:        "Admin Panel",
    nav_logout:       "Logout",
    navigation:       "Navigation",
    dark_theme:       "Dark mode",
    light_theme:      "Light mode",
    free_plan:        "free plan",
    pro_plan:         "pro plan",
    language:         "Language",
    mob_home:         "Home",
    mob_profile:      "Profile",
    mob_links:        "Links",
    mob_analytics:    "Analytics",
    mob_outreach:     "Outreach",
    loading:          "Loading...",
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
    save:             "Save",
    cancel:           "Cancel",
    months_per:       "/mo",
    forever_free:     "free forever",
    cancel_anytime:   "Cancel anytime",
  },
} as const;

export type TranslationKey = keyof typeof translations.sr;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage() {
  // useSyncExternalStore guarantees re-render in ALL components when locale changes
  const locale = useSyncExternalStore(
    (callback) => {
      _listeners.add(callback);
      return () => _listeners.delete(callback);
    },
    getLocale,
    () => "sr" as Locale // server snapshot
  );

  function t(key: TranslationKey): string {
    return (translations[locale] as Record<string, string>)[key]
      ?? (translations.sr as Record<string, string>)[key]
      ?? key;
  }

  return { locale, setLocale, t };
}

// ─── Init from localStorage (call once in root layout) ────────────────────────

export function initLocale() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem("pikmi-lang") as Locale | null;
  if (saved && ["sr", "hr", "en"].includes(saved) && saved !== _locale) {
    _locale = saved;
    _notify();
  }
}

// ─── LanguageProvider (samo init, ne treba context) ────────────────────────────

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Inicijalizuj locale iz localStorage pri prvom rendu
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("pikmi-lang") as Locale | null;
    if (saved && ["sr", "hr", "en"].includes(saved)) {
      _locale = saved;
    }
  }
  return <>{children}</>;
}
