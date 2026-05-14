"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handle() {
      const code = searchParams.get("code");

      if (code) {
        // PKCE flow — zamijeni code za sesiju
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/reset-password");
          return;
        }
      }

      // Fallback: slušaj auth event (implicit flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          subscription.unsubscribe();
          router.replace("/reset-password");
        }
      });

      setTimeout(() => {
        subscription.unsubscribe();
        router.replace("/login?error=expired");
      }, 5000);
    }

    handle();
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0D0D0F",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 15, color: "#888" }}>Verifikacija u toku...</div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0D0D0F" }}>
        <div style={{ fontSize: 15, color: "#888" }}>Učitavanje...</div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
