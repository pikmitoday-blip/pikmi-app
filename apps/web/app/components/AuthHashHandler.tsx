"use client";
import { useEffect } from "react";

export default function AuthHashHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;

    const currentPath = window.location.pathname;

    if (hash.includes("type=recovery")) {
      // Recovery tok — idi direktno na reset lozinke
      if (currentPath !== "/reset-password") {
        window.location.replace("/reset-password" + hash);
      }
    } else {
      // Obični login — idi na callback
      if (currentPath !== "/auth/callback") {
        window.location.replace("/auth/callback" + hash);
      }
    }
  }, []);

  return null;
}
