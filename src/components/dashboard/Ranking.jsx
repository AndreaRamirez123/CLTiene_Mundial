export default function Ranking({ ranking }) {
  const medallas = ["🥇", "🥈", "🥉"];
  const yo = ranking.find(r => r.esYo);
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.15), rgba(253,119,81,0.1))", border: "1px solid rgba(236,168,45,0.3)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Tu posición actual</div>
        <div style={{ color: "#ECA82D", fontSize: 36, fontWeight: 900 }}>#{yo?.pos || "—"}</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>¡Sigue prediciendo para subir!</div>
      </div>
      {ranking.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Cargando ranking...</div>
      ) : ranking.map((j, i) => (
        <div key={i} className="anim-slide-up" style={{ display: "flex", alignItems: "center", gap: 14, background: j.esYo ? "rgba(253,119,81,0.1)" : "rgba(255,255,255,0.04)", border: j.esYo ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, animationDelay: `${i * 0.06}s`, animationFillMode: "both" }}>
          <div style={{ fontSize: i < 3 ? 28 : 16, fontWeight: 900, color: "#ECA82D", minWidth: 36, textAlign: "center" }}>
            {i < 3 ? medallas[i] : `#${j.pos}`}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: j.esYo ? "#FD7751" : "#fff", fontWeight: 800, fontSize: 15 }}>
              {j.nombre} {j.esYo ? "👈 Tú" : ""}
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>{j.predicciones} predicciones</div>
          </div>
          <div style={{ color: "#ECA82D", fontWeight: 900, fontSize: 16 }}>🪙 {j.monedas}</div>
        </div>
      ))}
    </div>
  );
}
