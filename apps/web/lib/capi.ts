import crypto from "crypto";

export const PIXEL_ID = "980912031509026";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface CAPIEventData {
  eventName: string;
  eventId: string;
  userId?: string;
  userEmail?: string;
  userPhone?: string;
  ipAddress?: string;
  userAgent?: string;
  fbc?: string;       // Facebook click id (from fbclid / _fbc cookie)
  fbp?: string;       // Facebook browser id (_fbp cookie)
  currency?: string;
  value?: number;
  customData?: Record<string, any>;
  testEventCode?: string;
}

export async function sendCAPIEvent(data: CAPIEventData) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) { console.warn("[CAPI] META_CAPI_TOKEN not set"); return; }

  const userData: Record<string, any> = {};
  if (data.userEmail)  userData.em          = [sha256(data.userEmail)];
  if (data.userPhone)  userData.ph          = [sha256(data.userPhone.replace(/\D/g, ""))];
  if (data.userId)     userData.external_id = [sha256(data.userId)];
  if (data.ipAddress)  userData.client_ip_address = data.ipAddress;
  if (data.userAgent)  userData.client_user_agent  = data.userAgent;
  if (data.fbc)        userData.fbc = data.fbc;
  if (data.fbp)        userData.fbp = data.fbp;

  const payload: Record<string, any> = {
    data: [{
      event_name:    data.eventName,
      event_time:    Math.floor(Date.now() / 1000),
      event_id:      data.eventId,
      action_source: "website",
      user_data:     userData,
      custom_data:   {
        currency: data.currency ?? "RSD",
        value:    data.value ?? 0,
        ...data.customData,
      },
    }],
    access_token: token,
  };

  // Test event code za validaciju u Events Manager-u
  const testCode = data.testEventCode ?? process.env.META_TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok) console.error("[CAPI] Error:", json);
    else console.log(`[CAPI] ${data.eventName} sent, event_id=${data.eventId}`);
  } catch (err) {
    console.error("[CAPI] Fetch error:", err);
  }
}
