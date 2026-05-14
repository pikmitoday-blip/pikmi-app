"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleConfirm() {
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/reset-password";

      if (code) {
        // PKCE flow — zamijeni code za sesiju
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.push(next);
          return;
        }
      }

      // Implicit flow — token je u hash fragmentu, Supabase ga automatski preuzima
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Supabase client automatski parsira hash i postavlja sesiju
        // Samo sačekamo kratko pa preusmjerimo
        setTimeout(() => {
          router.push(next);
        }, 500);
        return;
      }

      // Pratimo promjenu auth state (za implicit flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
          subscription.unsubscribe();
          router.push(next);
        }
      });

      // Timeout fallback
      setTimeout(() => {
        router.push("/login?error=expired");
      }, 5000);
    }

    handleConfirm();
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 15, color: "var(--text2)" }}>Verifikacija u toku...</div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 15, color: "#666" }}>Učitavanje...</div>
      </div>
    }>
      <ConfirmHandler />
    </Suspense>
  );
}
