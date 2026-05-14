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
      const hash = typeof window !== "undefined" ? window.location.hash : "";

      // PKCE flow
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          const isRecovery =
            next === "/reset-password" ||
            searchParams.get("type") === "recovery";
          router.replace(isRecovery ? "/reset-password" : next);
          return;
        }
      }

      // Provjeri da li Supabase već ima sesiju (hash obrađen pri inicijalizaciji)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Ako hash sadrži type=recovery, idi na reset lozinke
        if (hash.includes("type=recovery")) {
          router.replace("/reset-password");
          return;
        }
        router.replace(next);
        return;
      }

      // Implicit flow — čekamo auth state event
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, sess) => {
        if (event === "PASSWORD_RECOVERY") {
          subscription.unsubscribe();
          router.replace("/reset-password");
        } else if (event === "SIGNED_IN" && sess) {
          subscription.unsubscribe();
          // Provjeri hash još jednom
          if (window.location.hash.includes("type=recovery")) {
            router.replace("/reset-password");
          } else {
            router.replace(next);
          }
        }
      });

      // Timeout fallback
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        router.replace("/login");
      }, 8000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }

    handle();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0D0D0F",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 15, color: "#888" }}>Verifikacija u toku...</div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0D0D0F",
          }}
        >
          <div style={{ fontSize: 15, color: "#888" }}>Učitavanje...</div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
