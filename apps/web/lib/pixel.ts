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
  // 1. Client-side pixel
  pixelTrack(eventName, params, eventId);
  // 2. Server-side CAPI (fire-and-forget)
  try {
    await fetch("/api/pixel/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, params, eventId, userId, userEmail }),
    });
  } catch {}
}

export const pixel = {
  /** Registracija završena — šalje i client i server */
  completeRegistration: (userId?: string, userEmail?: string) =>
    trackWithCapi("CompleteRegistration", {}, userId, userEmail),

  /** Korisnik počne koristiti platformu — šalje i client i server */
  startTrial: (userId?: string) =>
    trackWithCapi("StartTrial", { currency: "RSD", value: 0 }, userId),

  /** Klik na "Pretplati se" — samo client */
  initiateCheckout: (value = 990) =>
    pixelTrack("InitiateCheckout", { currency: "RSD", value }),
};
