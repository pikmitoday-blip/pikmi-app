// Meta Pixel helper — client-side events
declare global {
  interface Window { fbq?: (...args: any[]) => void; }
}

export function pixelTrack(event: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params ?? {});
  }
}

export const pixel = {
  // Korisnik završi registraciju
  completeRegistration: () => pixelTrack("CompleteRegistration"),

  // Korisnik počne trial (završi onboarding)
  startTrial: () => pixelTrack("StartTrial", { currency: "RSD", value: 0 }),

  // Inicijalizacija checkout-a (klik na pretplati se)
  initiateCheckout: (value?: number) =>
    pixelTrack("InitiateCheckout", { currency: "RSD", value: value ?? 990 }),
};
