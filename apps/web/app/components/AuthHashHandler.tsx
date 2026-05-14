"use client";
import { useEffect } from "react";

export default function AuthHashHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      // Preusmjeri na /auth/callback sa hash fragmentom
      window.location.replace("/auth/callback" + hash);
    }
  }, []);

  return null;
}
