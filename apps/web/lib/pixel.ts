// Meta Pixel — client-side events sa deduplicacijom
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

/**
 * Šalje event i NA CLIENT i NA SERVER (CAPI) sa istim event_id za deduplicaciju.
 * Server poziv ide kroz /api/pixel/event route.
 */
async function trackWithCapi(
  eventName: string,
  params: Record<string, any> = {},
  userId?: string,
  userEmail?: string
) {
  const eventId = generateEventId();
  const { fbp, fbc } = getFbIds();
  // 1. Client-side pixel
  pixelTrack(eventName, params, eventId);
  // 2. Server-side CAPI (fire-and-forget) — include fbp/fbc for better matching
  try {
    await fetch("/api/pixel/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, params, eventId, userId, userEmail, fbp, fbc }),
    });
  } catch {}
}

export const pixel = {
  /** Registracija završena — šalje i client i server */
  completeRegistration: (userId?: string, userEmail?: string) =>
    trackWithCapi("CompleteRegistration", {}, userId, userEmail),

  /** Korisnik počne koristiti platformu — šalje i client i server.
   *  Vrednost 99 RSD radi optimizacije oglasa (iako je trial besplatan). */
  startTrial: (userId?: string) =>
    trackWithCapi("StartTrial", { currency: "RSD", value: 99.00 }, userId),

  /** Klik na "Pretplati se" — samo client */
  initiateCheckout: (value = 990) =>
    pixelTrack("InitiateCheckout", { currency: "RSD", value }),
};
