// Meta Pixel — client-side events sa deduplicacijom (event_id se deli sa serverom)
declare global {
  interface Window { fbq?: (...args: any[]) => void; }
}

export const PIXEL_ID = "980912031509026";

/** Generiše unikatni event_id za deduplicaciju između client i server */
export function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** Vrati fbp (_fbp cookie) i fbc (_fbc cookie ili izgrađen iz fbclid u URL-u). */
export function getFbIds(): { fbp?: string; fbc?: string } {
  if (typeof window === "undefined") return {};
  const fbp = readCookie("_fbp");
  let fbc = readCookie("_fbc");
  if (!fbc) {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return { fbp, fbc };
}

/** Šalje event na client pixel sa event_id za deduplicaciju */
export function pixelTrack(event: string, params?: Record<string, any>, eventId?: string) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params ?? {}, { eventID: eventId ?? generateEventId() });
  }
}

// ── Dedup guards ──────────────────────────────────────────────────────────────
function sessionOnce(key: string): boolean {
  // returns true if this is the FIRST time in the session for `key`
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch { return true; }
}
function localOnce(key: string): boolean {
  // returns true if this is the FIRST time ever (this browser) for `key`
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  } catch { return true; }
}

interface TrackOpts {
  /** server-side once-per-user flag column suffix (e.g. "registration", "trial") */
  onceKey?: string;
}

/**
 * Šalje event i NA CLIENT i NA SERVER (CAPI) sa ISTIM event_id (deduplikacija).
 * Server poziv ide kroz /api/pixel/event route, koji uz onceKey radi i DB proveru.
 */
async function trackWithCapi(
  eventName: string,
  params: Record<string, any> = {},
  userId?: string,
  userEmail?: string,
  opts: TrackOpts = {}
) {
  const eventId = generateEventId();
  const { fbp, fbc } = getFbIds();
  // 1. Client-side pixel (isti event_id)
  pixelTrack(eventName, params, eventId);
  // 2. Server-side CAPI (fire-and-forget) — uključuje fbp/fbc i (opciono) onceKey
  try {
    await fetch("/api/pixel/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, params, eventId, userId, userEmail, fbp, fbc, onceKey: opts.onceKey }),
    });
  } catch {}
}

export const pixel = {
  /**
   * PageView — šalje se SAMO jednom po stranici u jednoj sesiji
   * (refresh iste stranice ne okida ponovo).
   */
  pageView: (path?: string) => {
    const key = `pv:${path ?? (typeof location !== "undefined" ? location.pathname : "")}`;
    if (!sessionOnce(key)) return;
    trackWithCapi("PageView", {});
  },

  /**
   * Registracija završena — okida se jednom po korisniku/uređaju.
   * Server dodatno proverava DB flag (cross-device once-per-user).
   */
  completeRegistration: (userId?: string, userEmail?: string) => {
    if (!localOnce(`capi:reg:${userId ?? "anon"}`)) return;
    trackWithCapi("CompleteRegistration", {}, userId, userEmail, { onceKey: "registration" });
  },

  /**
   * Trial aktiviran — jednom po korisniku. Vrednost 99 RSD radi optimizacije
   * (iako je trial besplatan). Server dodatno proverava DB flag.
   */
  startTrial: (userId?: string, userEmail?: string) => {
    if (!localOnce(`capi:trial:${userId ?? "anon"}`)) return;
    trackWithCapi("StartTrial", { currency: "RSD", value: 99.00 }, userId, userEmail, { onceKey: "trial" });
  },

  /**
   * InitiateCheckout — klik na plaćanje / otvaranje Stripe forme.
   * Jednom po sesiji kupovine (po vrednosti plana).
   */
  initiateCheckout: (value = 990, userId?: string, userEmail?: string) => {
    if (!sessionOnce(`ic:${value}`)) return;
    trackWithCapi("InitiateCheckout", { currency: "RSD", value }, userId, userEmail);
  },
};
