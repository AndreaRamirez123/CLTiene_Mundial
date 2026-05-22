export default function Ranking({ ranking }) {
  const medallas = ["🥇", "🥈", "🥉"];
  const yo = ranking.find(r => r.esYo);
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.15), rgba(253,119,81,0.1))", border: "1px solid rgba(236,168,45,0.3)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ color: "var(--texto-sec)", fontSize: 12 }}>Tu posición actual</div>
        <div style={{ color: "#ECA82D", fontSize: 36, fontWeight: 900 }}>#{yo?.pos || "—"}</div>
        <div style={{ color: "var(--texto-ter)", fontSize: 12 }}>¡Acierta predicciones para subir!</div>
      </div>
      <div style={{ background: "rgba(22,199,132,0.08)", border: "1px solid rgba(22,199,132,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🏆</span>
        <span style={{ color: "var(--texto-sec)", fontSize: 12, lineHeight: 1.4 }}>
          El ranking se ordena por <b style={{ color: "#16C784" }}>⚽ goles</b> ganados al acertar predicciones.
        </span>
      </div>
      <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16, border: "1px solid rgba(236,168,45,0.3)" }}>
        <div style={{ background: "linear-gradient(135deg, #ECA82D, #FD7751)", padding: "10px 16px", textAlign: "center" }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>🏆 Premios Mundial</span>
        </div>
        {[
          { medalla: "🥇", puesto: "1er puesto", premio: "Glamping fin de semana para 2 personas + 2 meses plan manada (1 persona)" },
          { medalla: "🥈", puesto: "2do puesto", premio: "Almuerzo Gran Parrilla o Altas Vistas + 2 meses cualquier plan (1 persona)" },
          { medalla: "🥉", puesto: "3er puesto", premio: "2 meses cualquier plan (1 persona)" },
        ].map(({ medalla, puesto, premio }) => (
          <div key={puesto} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "var(--card)", borderTop: "1px solid var(--card-border)" }}>
            <span style={{ fontSize: 22 }}>{medalla}</span>
            <div>
              <div style={{ color: "#ECA82D", fontWeight: 800, fontSize: 12 }}>{puesto}</div>
              <div style={{ color: "var(--texto-sec)", fontSize: 12, lineHeight: 1.4 }}>{premio}</div>
            </div>
          </div>
        ))}
      </div>
      {ranking.length === 0 ? (
        <div style={{ color: "var(--texto-ter)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Cargando ranking...</div>
      ) : ranking.slice(0, 10).map((j, i) => (
        <div key={i} className="anim-slide-up" style={{ display: "flex", alignItems: "center", gap: 14, background: j.esYo ? "rgba(253,119,81,0.1)" : "var(--card)", border: j.esYo ? "2px solid #FD7751" : "1px solid var(--card-border)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, animationDelay: `${i * 0.06}s`, animationFillMode: "both" }}>
          <div style={{ fontSize: i < 3 ? 28 : 16, fontWeight: 900, color: "#ECA82D", minWidth: 36, textAlign: "center" }}>
            {i < 3 ? medallas[i] : `#${j.pos}`}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: j.esYo ? "#FD7751" : "var(--texto)", fontWeight: 800, fontSize: 15 }}>
              {j.nombre} {j.esYo ? "👈 Tú" : ""}
            </div>
            <div style={{ color: "var(--texto-ter)", fontSize: 12, marginTop: 2 }}>
              {j.predicciones_acertadas || 0} aciertos
            </div>
          </div>
          <div style={{ color: "#16C784", fontWeight: 900, fontSize: 18 }}>⚽ {j.goles || 0}</div>
        </div>
      ))}
    </div>
  );
}
