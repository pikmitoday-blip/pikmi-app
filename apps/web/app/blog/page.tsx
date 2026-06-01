"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("sr", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    async function load() {
      try {
        const { data } = await supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, cover_image, published_at, created_at")
          .eq("published", true)
          .order("published_at", { ascending: false });
        setPosts(data ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      color: "#F9FAFB",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16,
      }}>
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 7 }}>
          <img src="/pikmilogo.jpg" alt="pikmi" width={26} height={26} style={{ objectFit: "contain", display: "block" }} />
          <span style={{ fontWeight: 800, fontSize: 20, background: "linear-gradient(135deg, #7C3AED, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            pikmi
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1, justifyContent: "center" }}>
          {[
            { href: "/#features", label: "Features" },
            { href: "/#how",      label: "Kako funkcioniše" },
            { href: "/#pricing",  label: "Cene" },
            { href: "/blog",      label: "Blog" },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 14, color: l.href === "/blog" ? "#A78BFA" : "rgba(255,255,255,0.65)",
              textDecoration: "none", fontWeight: l.href === "/blog" ? 700 : 400,
              transition: "color 0.15s",
            }}>
              {l.label}
            </a>
          ))}
        </div>
        <Link href="/register" style={{
          padding: "8px 18px", borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
          color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700,
        }}>
          Kreiraj profil
        </Link>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px 100px" }}>
        {/* Header */}
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 14px", borderRadius: 20,
            background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
            fontSize: 12, fontWeight: 600, color: "#A78BFA", marginBottom: 20,
          }}>
            ✦ pikmi blog
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 14, lineHeight: 1.15 }}>
            Resursi za freelancere
          </h1>
          <p style={{ fontSize: 16, color: "#6B7280", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            Saveti, strategije i priče za freelancere koji žele da pronađu bolje klijente i rastu.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: "#111116", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, height: 180, opacity: 0.5,
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F9FAFB", marginBottom: 8 }}>Uskoro novi sadržaj</h2>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Radimo na prvim člancima. Svrati uskoro.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {posts.map((post, index) => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                <article style={{
                  background: "#111116",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16, overflow: "hidden",
                  display: "flex", flexDirection: index === 0 ? "column" : "row",
                  transition: "border-color 0.2s, transform 0.2s",
                  cursor: "pointer",
                }}>
                  {/* Cover slika */}
                  {post.cover_image ? (
                    <div style={{
                      flexShrink: 0,
                      width: index === 0 ? "100%" : 220,
                      height: index === 0 ? 280 : "auto",
                      overflow: "hidden",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      flexShrink: 0,
                      width: index === 0 ? "100%" : 220,
                      height: index === 0 ? 220 : "auto",
                      minHeight: index === 0 ? 220 : 160,
                      background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.15))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 48,
                    }}>
                      ✍️
                    </div>
                  )}

                  {/* Sadržaj kartice */}
                  <div style={{ padding: index === 0 ? "28px 32px" : "24px 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      {/* Meta: datum + autor */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>
                          {formatDate(post.published_at ?? post.created_at)}
                        </span>
                        <span style={{ fontSize: 12, color: "#374151" }}>·</span>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>by pikmi</span>
                      </div>

                      {/* Naslov */}
                      <h2 style={{
                        fontSize: index === 0 ? 24 : 18,
                        fontWeight: 700, color: "#F9FAFB",
                        marginBottom: 10, lineHeight: 1.3,
                      }}>
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p style={{
                          fontSize: 14, color: "#9CA3AF",
                          lineHeight: 1.65, margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#7C3AED" }}>
                      Čitaj članak
                      <span style={{ fontSize: 16 }}>→</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
