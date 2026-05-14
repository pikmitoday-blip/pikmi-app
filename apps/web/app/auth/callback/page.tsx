"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handle() {
      const next = searchParams.get("next") ?? "/dashboard";
      const code = searchParams.get("code");

      // PKCE flow
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(next);
          return;
        }
      }

      // Implicit flow — Supabase automatski parsira #access_token iz hash fragmenta
      // Čekamo auth state event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          subscription.unsubscribe();
          router.replace("/reset-password");
        } else if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          router.replace(next);
        }
      });

      // Timeout fallback
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        router.replace("/login");
      }, 6000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
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
