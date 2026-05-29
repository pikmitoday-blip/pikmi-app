"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

interface UserCtx { userId: string; }
const UserContext = createContext<UserCtx>({ userId: "" });

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Initialize synchronously from sessionStorage — zero-flash on revisit
  const [userId, setUserId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return sessionStorage.getItem("pikmi-uid") ?? ""; } catch { return ""; }
  });

  useEffect(() => {
    // getSession reads from Supabase's localStorage cache — no network call
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? "";
      setUserId(uid);
      try {
        if (uid) sessionStorage.setItem("pikmi-uid", uid);
        else sessionStorage.removeItem("pikmi-uid");
      } catch {}
    });

    // Keep in sync when auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const uid = session?.user?.id ?? "";
      setUserId(uid);
      try {
        if (uid) sessionStorage.setItem("pikmi-uid", uid);
        else sessionStorage.removeItem("pikmi-uid");
      } catch {}
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userId }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
