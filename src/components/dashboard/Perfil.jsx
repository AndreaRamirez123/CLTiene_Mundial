import { C } from "./constants";

export default function Perfil({ perfil, nombre, monedas, posicion, ranking, usuario }) {
  const goles = perfil?.goles || 0;
  const email = usuario?.email || "";
  const predicciones = perfil?.predicciones_count || 0;
  const nivel = perfil?.nivel || 1;

  return (
    <div>
      {/* Avatar y nombre */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #822BD2, #408DFF)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 36, fontWeight: 900, color: "var(--texto)", border: "3px solid #FD7751" }}>
          {nombre.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ color: "var(--texto)", fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>{nombre}</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>{email}</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(130,43,210,0.2)", border: "1px solid rgba(130,43,210,0.4)", borderRadius: 20, padding: "4px 14px", marginTop: 8 }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ color: C.morado, fontSize: 13, fontWeight: 700 }}>Nivel {nivel}</span>
        </div>
      </div>

      {/* Stats: Monedas y Goles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "rgba(236,168,45,0.1)", border: "1px solid rgba(236,168,45,0.3)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🪙</div>
          <div style={{ color: C.dorado, fontSize: 28, fontWeight: 900 }}>{monedas}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>Monedas</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>Ganas en la Polla</div>
        </div>
        <div style={{ background: "rgba(22,199,132,0.1)", border: "1px solid rgba(22,199,132,0.3)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>⚽</div>
          <div style={{ color: C.verde, fontSize: 28, fontWeight: 900 }}>{goles}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>Goles</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>Ganas en Misiones</div>
        </div>
      </div>

      {/* Más estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px", textAlign: "center" }}>
          <div style={{ color: C.naranja, fontSize: 24, fontWeight: 900 }}>#{posicion}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Ranking</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px", textAlign: "center" }}>
          <div style={{ color: C.azul, fontSize: 24, fontWeight: 900 }}>{predicciones}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Predicciones</div>
        </div>
      </div>

      {/* Mini ranking - top 3 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>🏆 Top 3 del ranking</div>
        {ranking.slice(0, 3).map((j, i) => {
          const medallas = ["🥇", "🥈", "🥉"];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: j.esYo ? "rgba(253,119,81,0.1)" : "rgba(255,255,255,0.04)", border: j.esYo ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{medallas[i]}</span>
              <div style={{ flex: 1 }}>
                <span style={{ color: j.esYo ? C.naranja : "#fff", fontWeight: 700, fontSize: 14 }}>{j.nombre} {j.esYo ? "👈" : ""}</span>
              </div>
              <span style={{ color: C.dorado, fontWeight: 900, fontSize: 14 }}>🪙 {j.monedas}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
