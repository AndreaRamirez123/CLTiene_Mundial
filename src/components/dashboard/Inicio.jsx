import { formatearFecha, Bandera } from "./constants";

export default function Inicio({ setTab, reclamarBono, partidos }) {
  const proximos = partidos.filter(p => p.estado === "pendiente").slice(0, 3);
  return (
    <div>
      {/* Cuenta regresiva */}
      <div style={{ background: "linear-gradient(135deg, #7c1a8c, #1a0f3d)", border: "1px solid rgba(130,43,210,0.5)", borderRadius: 16, padding: "18px 16px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: 0.1 }}>🌎</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>El torneo comienza en</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {[["85", "DÍAS"], ["14", "HRS"], ["32", "MIN"]].map(([n, l]) => (
            <div key={l} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 56 }}>
              <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{n}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>🏟️ USA · México · Canadá 2026</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>⚽ Próximos partidos</span>
        <button onClick={() => setTab("polla")} style={{ background: "none", border: "none", color: "#FD7751", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Predecir todos →</button>
      </div>

      {proximos.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Cargando partidos...</div>
      ) : proximos.map((p, idx) => (
        <div key={p.id} className="anim-slide-up" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Grupo {p.grupo}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>📅 {formatearFecha(p.fecha)} · {p.hora}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <Bandera codigo={p.bandera_l} nombre={p.local} />
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginTop: 6 }}>{p.local}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>VS</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Bandera codigo={p.bandera_v} nombre={p.visitante} />
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginTop: 6 }}>{p.visitante}</div>
            </div>
          </div>
          <button onClick={() => setTab("polla")} style={{ width: "100%", marginTop: 12, padding: "9px", background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ⚽ Hacer predicción
          </button>
        </div>
      ))}

      {/* Bono diario */}
      <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.2), rgba(253,119,81,0.1))", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 14, padding: "16px", marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#ECA82D", fontWeight: 800, fontSize: 15 }}>🪙 Bono diario</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 3 }}>Tienes monedas esperándote</div>
        </div>
        <button className="anim-pulse" onClick={reclamarBono} style={{ background: "linear-gradient(135deg, #ECA82D, #c9891a)", border: "none", borderRadius: 10, color: "#231F20", fontWeight: 800, fontSize: 14, padding: "10px 18px", cursor: "pointer", boxShadow: "0 4px 16px rgba(236,168,45,0.4)" }}>
          ¡Reclamar!
        </button>
      </div>
    </div>
  );
}
