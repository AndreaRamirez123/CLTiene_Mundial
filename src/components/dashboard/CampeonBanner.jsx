import { Bandera } from "./constants";

const CONFETTI_ITEMS = [
  { left: "5%", delay: "0s", color: "#FFD700", size: 10, shape: "rect" },
  { left: "12%", delay: "0.3s", color: "#FD7751", size: 8, shape: "circle" },
  { left: "20%", delay: "0.6s", color: "#16C784", size: 12, shape: "rect" },
  { left: "28%", delay: "0.1s", color: "#FFD700", size: 7, shape: "circle" },
  { left: "35%", delay: "0.8s", color: "#408DFF", size: 9, shape: "rect" },
  { left: "42%", delay: "0.4s", color: "#FD7751", size: 11, shape: "circle" },
  { left: "50%", delay: "0.2s", color: "#FFD700", size: 8, shape: "rect" },
  { left: "58%", delay: "0.9s", color: "#16C784", size: 10, shape: "circle" },
  { left: "65%", delay: "0.5s", color: "#FFD700", size: 7, shape: "rect" },
  { left: "72%", delay: "0.7s", color: "#FD7751", size: 12, shape: "circle" },
  { left: "80%", delay: "0.3s", color: "#408DFF", size: 9, shape: "rect" },
  { left: "88%", delay: "0.6s", color: "#FFD700", size: 8, shape: "circle" },
  { left: "94%", delay: "0.1s", color: "#16C784", size: 11, shape: "rect" },
];

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default function CampeonBanner({ partidos, ranking }) {
  const final = (partidos || []).find(
    (p) => p.fase === "Final" && p.estado === "finalizado"
  );
  if (!final) return null;

  const top3 = (ranking || []).slice(0, 3);

  const esCampeonLocal = final.resultado === "local";
  const campeon = esCampeonLocal ? final.local : final.visitante;
  const bandera = esCampeonLocal ? final.bandera_l : final.bandera_v;
  const subcampeon = esCampeonLocal ? final.visitante : final.local;

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(320px) rotate(720deg); opacity: 0; }
        }
        @keyframes trophyPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(255,215,0,0.6)); }
          50%       { transform: scale(1.12); filter: drop-shadow(0 0 24px rgba(255,215,0,1)); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        marginBottom: 16,
        background: "linear-gradient(135deg, #1a1200 0%, #2d1f00 40%, #1a0d00 100%)",
        border: "2px solid rgba(255,215,0,0.5)",
        boxShadow: "0 0 40px rgba(255,215,0,0.25)",
        padding: "24px 20px 20px",
        textAlign: "center",
      }}>
        {/* Confetti */}
        {CONFETTI_ITEMS.map((c, i) => (
          <div key={i} style={{
            position: "absolute",
            top: -16,
            left: c.left,
            width: c.shape === "circle" ? c.size : c.size * 1.2,
            height: c.shape === "circle" ? c.size : c.size * 0.6,
            borderRadius: c.shape === "circle" ? "50%" : 2,
            background: c.color,
            animation: `confettiFall 2.8s ease-in ${c.delay} infinite`,
            opacity: 0.85,
            zIndex: 1,
          }} />
        ))}

        {/* Copa */}
        <div style={{
          fontSize: 52,
          animation: "trophyPulse 2s ease-in-out infinite",
          display: "inline-block",
          marginBottom: 8,
          position: "relative",
          zIndex: 2,
        }}>🏆</div>

        {/* Título */}
        <div style={{
          background: "linear-gradient(90deg, #b8860b, #FFD700, #FFA500, #FFD700, #b8860b)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "shimmer 3s linear infinite",
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 12,
          position: "relative",
          zIndex: 2,
        }}>
          ¡Campeón del Mundo 2026!
        </div>

        {/* Bandera + nombre */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          position: "relative",
          zIndex: 2,
        }}>
          <Bandera codigo={bandera} nombre={campeon} size={72} />
          <div style={{
            color: "#FFFFFF",
            fontSize: 30,
            fontWeight: 900,
            textShadow: "0 2px 20px rgba(255,215,0,0.6)",
            letterSpacing: "-0.5px",
          }}>
            {campeon}
          </div>
        </div>

        {/* Marcador final */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255,215,0,0.1)",
          border: "1px solid rgba(255,215,0,0.3)",
          borderRadius: 12,
          padding: "8px 16px",
          marginBottom: 12,
          position: "relative",
          zIndex: 2,
        }}>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{final.local}</span>
          <span style={{ color: "#FFD700", fontWeight: 900, fontSize: 16 }}>
            {final.goles_local} - {final.goles_visitante}
          </span>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{final.visitante}</span>
          {final.penales && (
            <span style={{ color: "rgba(255,215,0,0.7)", fontSize: 11, marginLeft: 4 }}>
              (Pen: {final.penales})
            </span>
          )}
        </div>

        {/* Subcampeón */}
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, position: "relative", zIndex: 2, marginBottom: top3.length ? 16 : 0 }}>
          Subcampeón: {subcampeon}
        </div>

        {/* Top 3 ganadores de la polla */}
        {top3.length > 0 && (
          <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
            <div style={{ height: 1, background: "rgba(255,215,0,0.2)", marginBottom: 12 }} />
            <div style={{ color: "rgba(255,215,0,0.7)", fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              🏆 Ganadores de la polla
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {top3.map((j, i) => (
                <div key={j.nombre} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: i === 0 ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.05)",
                  border: i === 0 ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  textAlign: "left",
                }}>
                  <span style={{ fontSize: 18 }}>{MEDALLAS[i]}</span>
                  <span style={{ flex: 1, color: i === 0 ? "#FFD700" : "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {j.nombre}
                  </span>
                  <span style={{ color: i === 0 ? "#FFD700" : "rgba(255,255,255,0.5)", fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" }}>
                    ⚽ {j.goles}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
