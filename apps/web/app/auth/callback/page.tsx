"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase automatski parsira hash fragment (#access_token=...) pri inicijalizaciji
    // Slušamo PASSWORD_RECOVERY event koji Supabase emituje kad detektuje recovery token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        subscription.unsubscribe();
        router.push("/reset-password");
      }
    });

    // Fallback: ako event ne dođe za 4 sekunde
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      router.push("/login?error=expired");
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
