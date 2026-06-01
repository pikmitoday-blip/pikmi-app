import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const { data } = await getSupabase()
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  return data ?? null;
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Post nije pronađen | Pikmi Blog" };

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || "";
  const url = `https://pikmi.today/blog/${post.slug}`;

  return {
    title: `${title} | Pikmi Blog`,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.published_at ?? post.created_at,
      ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}),
    },
    twitter: {
      card: post.cover_image ? "summary_large_image" : "summary",
      title,
      description,
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
    alternates: { canonical: url },
  };
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("sr-Latn", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// Minimal markdown renderer — handles headings, bold, italic, links, code, paragraphs
function renderMarkdown(md: string): string {
  return md
    // Escape HTML
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Blockquote
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    // Paragraphs (double newline)
    .split(/\n{2,}/)
    .map(block => {
      if (/^<(h[1-6]|ul|ol|li|blockquote|hr|pre)/.test(block.trim())) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

export default async function BlogPostPage(
  { params }: { params: { slug: string } }
) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const htmlContent = post.content ? renderMarkdown(post.content) : "";

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
        justifyContent: "space-between",
        gap: 16,
      }}>
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 7 }}>
          <img src="/pikmilogo.jpg" alt="pikmi" width={26} height={26} style={{ objectFit: "contain", display: "block" }} />
          <span style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg, #7C3AED, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
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

      {/* Cover image */}
      {post.cover_image && (
        <div style={{ width: "100%", maxHeight: 420, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image}
            alt={post.title}
            style={{ width: "100%", height: 420, objectFit: "cover" }}
          />
        </div>
      )}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Meta */}
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
          {formatDate(post.published_at ?? post.created_at)}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: "#F9FAFB" }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: 18, color: "#9CA3AF", lineHeight: 1.7, marginBottom: 36, paddingBottom: 36, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{ fontSize: 16, lineHeight: 1.8, color: "#D1D5DB" }}
        />

        {/* Back */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/blog" style={{ fontSize: 14, color: "#7C3AED", textDecoration: "none", fontWeight: 600 }}>
            ← Nazad na blog
          </Link>
        </div>
      </div>

      <style>{`
        .blog-content h1, .blog-content h2, .blog-content h3 {
          color: #F9FAFB;
          font-weight: 700;
          margin: 2em 0 0.75em;
          line-height: 1.3;
        }
        .blog-content h1 { font-size: 28px; }
        .blog-content h2 { font-size: 22px; }
        .blog-content h3 { font-size: 18px; }
        .blog-content p { margin: 0 0 1.25em; }
        .blog-content a { color: #A78BFA; }
        .blog-content a:hover { text-decoration: underline; }
        .blog-content strong { color: #F9FAFB; font-weight: 700; }
        .blog-content em { font-style: italic; }
        .blog-content code {
          background: rgba(124,58,237,0.12);
          border: 1px solid rgba(124,58,237,0.25);
          border-radius: 4px;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 0.9em;
          color: #A78BFA;
        }
        .blog-content ul, .blog-content ol {
          padding-left: 1.5em;
          margin: 0 0 1.25em;
        }
        .blog-content li { margin-bottom: 0.4em; }
        .blog-content blockquote {
          border-left: 3px solid #7C3AED;
          margin: 1.5em 0;
          padding: 0.5em 1em;
          background: rgba(124,58,237,0.05);
          border-radius: 0 6px 6px 0;
          color: #9CA3AF;
          font-style: italic;
        }
        .blog-content hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin: 2em 0;
        }
        .blog-content img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
}
