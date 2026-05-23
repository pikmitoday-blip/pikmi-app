"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("id, title, slug, excerpt, published, published_at, created_at")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  }

  async function togglePublish(id: string, current: boolean) {
    await supabaseAdmin.from("blog_posts").update({
      published: !current,
      published_at: !current ? new Date().toISOString() : null,
    }).eq("id", id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, published: !current } : p));
  }

  async function deletePost(id: string) {
    if (!confirm("Obriši post?")) return;
    await supabaseAdmin.from("blog_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "danas";
    if (days === 1) return "juče";
    return `${days}d ago`;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Blog postovi</h1>
          <p style={{ fontSize: 13, color: "#6B7280" }}>{posts.length} postova · {posts.filter(p => p.published).length} objavljeno</p>
        </div>
        <Link href="/admin/blog/new" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 10,
          background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
          color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700,
        }}>
          + Novi post
        </Link>
      </div>

      {loading ? (
        <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>Učitavanje...</div>
      ) : posts.length === 0 ? (
        <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✍️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#F9FAFB", marginBottom: 8 }}>Nema blog postova</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Kreiraj prvi post i poboljšaj SEO pikmi platforme</div>
          <Link href="/admin/blog/new" style={{ display: "inline-flex", padding: "10px 20px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, color: "#A78BFA", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            + Kreiraj post
          </Link>
        </div>
      ) : (
        <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Naslov", "Status", "URL", "Datum", "Akcije"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB", marginBottom: 3 }}>{post.title}</div>
                    {post.excerpt && (
                      <div style={{ fontSize: 12, color: "#4B5563", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.excerpt}</div>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 4,
                      background: post.published ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                      color: post.published ? "#4ADE80" : "#6B7280",
                      border: `1px solid ${post.published ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                      {post.published ? "✓ Objavljeno" : "Draft"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: "#A78BFA", textDecoration: "none", fontFamily: "monospace" }}>
                      /blog/{post.slug} ↗
                    </a>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#4B5563" }}>
                    {timeAgo(post.created_at)}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={`/admin/blog/${post.id}`} style={{
                        fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "#9CA3AF", textDecoration: "none",
                      }}>
                        Uredi
                      </Link>
                      <button onClick={() => togglePublish(post.id, post.published)} style={{
                        fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
                        background: post.published ? "rgba(251,191,36,0.08)" : "rgba(34,197,94,0.08)",
                        border: `1px solid ${post.published ? "rgba(251,191,36,0.2)" : "rgba(34,197,94,0.2)"}`,
                        color: post.published ? "#FBBF24" : "#4ADE80",
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {post.published ? "Unpublish" : "Objavi"}
                      </button>
                      <button onClick={() => deletePost(post.id)} style={{
                        fontSize: 12, padding: "5px 10px", borderRadius: 6,
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        color: "#F87171", cursor: "pointer", fontFamily: "inherit",
                      }}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
