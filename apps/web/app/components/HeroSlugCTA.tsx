"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function HeroSlugCTA({ ctaLabel }: { ctaLabel: string }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  function go() {
    const clean = slugify(slug);
    if (clean) router.push(`/register?slug=${encodeURIComponent(clean)}`);
    else router.push("/register");
  }

  return (
    <div className="hero-slug-cta" style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 460 }}>
      {/* pikmi.today/ prefixed input */}
      <div style={{
        display: "flex", alignItems: "stretch",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 14, overflow: "hidden",
      }}>
        <span style={{
          display: "flex", alignItems: "center", padding: "0 4px 0 16px",
          fontSize: 15, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", fontWeight: 500,
        }}>
          pikmi.today/
        </span>
        <input
          value={slug}
          onChange={e => setSlug(slugify(e.target.value))}
          onKeyDown={e => { if (e.key === "Enter") go(); }}
          placeholder="tvoje-ime"
          style={{
            flex: 1, minWidth: 0, padding: "15px 12px 15px 0",
            background: "transparent", border: "none", outline: "none",
            color: "#fff", fontSize: 15, fontWeight: 500,
          }}
        />
      </div>

      <button
        onClick={go}
        style={{
          padding: "15px 36px", borderRadius: 14, border: "none",
          background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff",
          fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 4px 32px rgba(124,58,237,0.35)", letterSpacing: -0.2,
        }}
      >
        {ctaLabel} →
      </button>
    </div>
  );
}
