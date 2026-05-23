import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Pikmi",
  description: "Savjeti i resursi za freelancere — kako pronaći klijente, prezentovati se profesionalno i rasti.",
  openGraph: {
    title: "Blog | Pikmi",
    description: "Savjeti i resursi za freelancere.",
    url: "https://pikmi.today/blog",
  },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
}

async function getPosts(): Promise<BlogPost[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image, published_at, created_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  return data ?? [];
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("sr-Latn", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      color: "#F9FAFB",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg, #7C3AED, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            pikmi
          </span>
        </Link>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>Blog</h1>
          <p style={{ fontSize: 16, color: "#6B7280", maxWidth: 480, margin: "0 auto" }}>
            Savjeti, resursi i priče za freelancere koji žele da rastu.
          </p>
        </div>

        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "#4B5563" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✍️</div>
            <p style={{ fontSize: 16 }}>Uskoro novi sadržaj.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: "none" }}
              >
                <article style={{
                  background: "#111116",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  overflow: "hidden",
                  display: "flex",
                  transition: "border-color 0.15s",
                  cursor: "pointer",
                }}>
                  {post.cover_image && (
                    <div style={{ width: 200, flexShrink: 0, overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div style={{ padding: "24px 28px", flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
                      {formatDate(post.published_at ?? post.created_at)}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F9FAFB", marginBottom: 10, lineHeight: 1.3 }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.6, margin: 0 }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div style={{ marginTop: 16, fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>
                      Čitaj više →
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
