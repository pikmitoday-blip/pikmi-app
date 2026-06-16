export default function Backgrounds() {
  const options = [
    {
      id: 1,
      name: "Dot Grid",
      desc: "Suptilna mreža tačaka — klasičan SaaS look (Linear, Notion)",
      style: {
        background: "#0B0F19",
        backgroundImage: "radial-gradient(rgba(124,58,237,0.35) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      },
    },
    {
      id: 2,
      name: "Aurora Blobs",
      desc: "Lebdeći gradijentni oblaci — moderan, mekan",
      style: {
        background: "#0B0F19",
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(124,58,237,0.25) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(59,130,246,0.2) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 50% 50%, rgba(236,72,153,0.1) 0%, transparent 60%)
        `,
      },
    },
    {
      id: 3,
      name: "Grid Lines",
      desc: "Tanke linije mreže — techy, precizno",
      style: {
        background: "#0B0F19",
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      },
    },
    {
      id: 4,
      name: "Dot Grid + Glow",
      desc: "Tačke sa centralnim ljubičastim sjajem",
      style: {
        background: "#0B0F19",
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%),
          radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)
        `,
        backgroundSize: "auto, 24px 24px",
      },
    },
    {
      id: 5,
      name: "Gradient Mesh",
      desc: "Blagi gradijentni prelaz uglova — elegantno",
      style: {
        background: `
          radial-gradient(ellipse at top left,    rgba(124,58,237,0.2) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(59,130,246,0.2) 0%, transparent 50%),
          #0B0F19
        `,
      },
    },
  ];

  return (
    <div style={{ background: "#05070f", minHeight: "100vh", padding: "48px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
          Izbor pozadine
        </h1>
        <p style={{ color: "#6B7280", marginBottom: 40, fontSize: 15 }}>
          Klikni broj opcije koju želiš — javi mi i implementujem je u aplikaciju.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
          {options.map((o) => (
            <div
              key={o.id}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              }}
            >
              {/* Preview */}
              <div style={{ ...o.style, height: 200, position: "relative" }}>
                {/* Mini UI mockup */}
                <div style={{
                  position: "absolute", inset: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 16,
                }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                    <div style={{ width: 80, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.1)" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 70, borderRadius: 8,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }} />
                    ))}
                  </div>
                </div>
                <div style={{
                  position: "absolute", top: 8, left: 8,
                  background: "rgba(124,58,237,0.8)",
                  color: "white", fontWeight: 800, fontSize: 20,
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {o.id}
                </div>
              </div>

              {/* Label */}
              <div style={{ background: "#111827", padding: "14px 18px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                  {o.name}
                </div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>{o.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 32, padding: "20px 24px",
          background: "rgba(124,58,237,0.1)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 12, fontSize: 14, color: "#A78BFA",
        }}>
          💬 Javi mi broj (1–5) i pozadina će biti odmah postavljena u celu aplikaciju.
        </div>
      </div>
    </div>
  );
}
