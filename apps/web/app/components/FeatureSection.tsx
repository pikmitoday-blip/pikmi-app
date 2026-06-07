import React from "react";

export interface FeatureSectionProps {
  eyebrow?: string;
  title: string;
  description: string;
  extra?: string;
  /** Visual: a React node (custom animation), an image/gif URL, or raw HTML code. */
  visual?: React.ReactNode;
  imageUrl?: string;
  customCode?: string;   // raw HTML injected as the visual
  reverse?: boolean;     // text on left, visual on right
  accent?: string;
}

export default function FeatureSection({
  eyebrow, title, description, extra, visual, imageUrl, customCode,
  reverse = false, accent = "#A855F7",
}: FeatureSectionProps) {
  const visualNode = visual
    ? visual
    : customCode
    ? <div style={{ width: "100%" }} dangerouslySetInnerHTML={{ __html: customCode }} />
    : imageUrl
    ? <img src={imageUrl} alt={title} style={{ width: "100%", height: "auto", borderRadius: 20, display: "block", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }} />
    : null;

  return (
    <section className="feat-section" style={{ width: "100%", padding: "56px 48px" }}>
      <div
        className={`feat-inner ${reverse ? "feat-reverse" : ""}`}
        style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 64,
          flexDirection: reverse ? "row-reverse" : "row",
        }}
      >
        {/* Visual */}
        <div className="feat-visual" style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
          {visualNode}
        </div>

        {/* Text */}
        <div className="feat-text" style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && (
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: accent, marginBottom: 14 }}>
              {eyebrow}
            </div>
          )}
          <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1, lineHeight: 1.12, marginBottom: 18, color: "#fff" }}>
            {title}
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: extra ? 14 : 0 }}>
            {description}
          </p>
          {extra && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              {extra}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
