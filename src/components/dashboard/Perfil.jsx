import { C } from "./constants";

export default function Perfil({ perfil, nombre, monedas, posicion, ranking, usuario }) {
  const goles = perfil?.goles || 0;
  const email = usuario?.email || "";
  const predicciones = perfil?.predicciones_count || 0;
  const trivias = perfil?.trivias_jugadas || 0;
  const racha = perfil?.dias_consecutivos || 0;
  const nivel = perfil?.nivel || "inactivo";
  const referidos = perfil?.referidos_count || 0;

  const niveles = {
    muy_activo: {
      label: "Muy activo",
      color: C.verde,
      bg: "rgba(22,199,132,0.14)",
      border: "rgba(22,199,132,0.35)",
      icono: "🔥",
      detalle: "Entras seguido y participas bastante",
    },
    activo: {
      label: "Activo",
      color: C.azul,
      bg: "rgba(64,141,255,0.14)",
      border: "rgba(64,141,255,0.35)",
      icono: "⚡",
      detalle: "Mantienes movimiento en la plataforma",
    },
    inactivo: {
      label: "Inactivo",
      color: C.gris,
      bg: "rgba(255,255,255,0.08)",
      border: "rgba(255,255,255,0.16)",
      icono: "🌙",
      detalle: "Hace falta volver a entrar o participar",
    },
  };

  const nivelInfo = niveles[nivel] || niveles.inactivo;

  return (
    <div style={{ background: "linear-gradient(135deg, rgba(130,43,210,0.05) 0%, rgba(253,119,81,0.05) 100%)", borderRadius: 20, padding: "20px 0", minHeight: "100vh" }}>
      <div style={{ paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 8 }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #822BD2, #408DFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 44,
              fontWeight: 900,
              color: "#FFFFFF",
              border: "4px solid #FD7751",
              boxShadow: "0 8px 32px rgba(253,119,81,0.3), inset 0 1px 1px rgba(255,255,255,0.2)",
            }}
          >
            {nombre.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ color: "var(--texto)", fontSize: 26, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{nombre}</h2>
          <p style={{ color: "var(--texto-ter)", fontSize: 13, margin: 0, opacity: 0.8 }}>{email}</p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: `linear-gradient(135deg, ${nivelInfo.bg} 0%, rgba(255,255,255,0.02) 100%)`,
              border: `2px solid ${nivelInfo.border}`,
              borderRadius: 999,
              padding: "8px 16px",
              marginTop: 12,
              boxShadow: `0 4px 12px ${nivelInfo.color}20`,
            }}
          >
            <span style={{ fontSize: 16 }}>{nivelInfo.icono}</span>
            <span style={{ color: nivelInfo.color, fontSize: 13, fontWeight: 800 }}>{nivelInfo.label}</span>
          </div>
          <div style={{ color: "var(--texto-ter)", fontSize: 12, marginTop: 10, lineHeight: 1.4 }}>{nivelInfo.detalle}</div>
        </div>

      <div
        style={{
          background: `linear-gradient(135deg, ${nivelInfo.bg} 0%, rgba(255,255,255,0.02) 100%)`,
          border: `2px solid ${nivelInfo.border}`,
          borderRadius: 16,
          padding: "18px 16px",
          marginBottom: 18,
          boxShadow: `0 8px 24px ${nivelInfo.color}15`,
        }}
      >
        <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 15, marginBottom: 14 }}>
          📊 Tu actividad reciente
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)", borderRadius: 14, padding: "14px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)" }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🔥</div>
            <div style={{ color: nivelInfo.color, fontSize: 20, fontWeight: 900 }}>{racha}</div>
            <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 2 }}>Dias seguidos</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)", borderRadius: 14, padding: "14px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)" }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>⚽</div>
            <div style={{ color: nivelInfo.color, fontSize: 20, fontWeight: 900 }}>{predicciones}</div>
            <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 2 }}>Predicciones</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)", borderRadius: 14, padding: "14px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)" }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🧠</div>
            <div style={{ color: nivelInfo.color, fontSize: 20, fontWeight: 900 }}>{trivias}</div>
            <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 2 }}>Trivias</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18, transition: "all 0.3s" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.15) 0%, rgba(236,168,45,0.05) 100%)", border: "2px solid rgba(236,168,45,0.4)", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 8px 24px rgba(236,168,45,0.15)", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(236,168,45,0.25)" }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(236,168,45,0.15)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🪙</div>
          <div style={{ color: C.dorado, fontSize: 32, fontWeight: 900 }}>{monedas}</div>
          <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 6, fontWeight: 600 }}>Monedas</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 3, opacity: 0.8 }}>Por interacción y misiones</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(22,199,132,0.15) 0%, rgba(22,199,132,0.05) 100%)", border: "2px solid rgba(22,199,132,0.4)", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 8px 24px rgba(22,199,132,0.15)", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(22,199,132,0.25)" }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(22,199,132,0.15)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚽</div>
          <div style={{ color: C.verde, fontSize: 32, fontWeight: 900 }}>{goles}</div>
          <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 6, fontWeight: 600 }}>Goles</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 3, opacity: 0.8 }}>Acertando predicciones</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "linear-gradient(135deg, rgba(253,119,81,0.12) 0%, rgba(253,119,81,0.04) 100%)", border: "1.5px solid rgba(253,119,81,0.3)", borderRadius: 16, padding: "18px 14px", textAlign: "center", boxShadow: "0 4px 16px rgba(253,119,81,0.1)", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(253,119,81,0.2)" }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(253,119,81,0.1)" }}>
          <div style={{ color: C.naranja, fontSize: 28, fontWeight: 900 }}>#{posicion}</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 12, marginTop: 6, fontWeight: 600 }}>Ranking</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(64,141,255,0.12) 0%, rgba(64,141,255,0.04) 100%)", border: "1.5px solid rgba(64,141,255,0.3)", borderRadius: 16, padding: "18px 14px", textAlign: "center", boxShadow: "0 4px 16px rgba(64,141,255,0.1)", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(64,141,255,0.2)" }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(64,141,255,0.1)" }}>
          <div style={{ color: C.azul, fontSize: 28, fontWeight: 900 }}>{predicciones}</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 12, marginTop: 6, fontWeight: 600 }}>Predicciones</div>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, rgba(130,43,210,0.15) 0%, rgba(130,43,210,0.05) 100%)", border: "1.5px solid rgba(130,43,210,0.4)", borderRadius: 16, padding: "18px 16px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 16px rgba(130,43,210,0.1)", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(130,43,210,0.2)" }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(130,43,210,0.1)" }}>
        <div>
          <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 14 }}>🤝 Amigos referidos</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 12, marginTop: 3 }}>Cada referido te da 50 🪙</div>
        </div>
        <div style={{ color: "#822BD2", fontSize: 36, fontWeight: 900 }}>{referidos}</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 17, marginBottom: 14 }}>🏆 Top 3 del ranking</div>
        {ranking.slice(0, 3).map((j, i) => {
          const medallas = ["🥇", "🥈", "🥉"];
          const coloresGradiente = [
            { bg: "linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)", border: "rgba(255,215,0,0.3)" },
            { bg: "linear-gradient(135deg, rgba(192,192,192,0.15) 0%, rgba(192,192,192,0.05) 100%)", border: "rgba(192,192,192,0.3)" },
            { bg: "linear-gradient(135deg, rgba(205,127,50,0.15) 0%, rgba(205,127,50,0.05) 100%)", border: "rgba(205,127,50,0.3)" }
          ];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: j.esYo ? "linear-gradient(135deg, rgba(253,119,81,0.15) 0%, rgba(253,119,81,0.05) 100%)" : coloresGradiente[i].bg,
                border: j.esYo ? "2px solid #FD7751" : `1.5px solid ${coloresGradiente[i].border}`,
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 10,
                boxShadow: j.esYo ? "0 4px 16px rgba(253,119,81,0.2)" : "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = j.esYo ? "0 8px 24px rgba(253,119,81,0.3)" : "0 6px 16px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = j.esYo ? "0 4px 16px rgba(253,119,81,0.2)" : "0 2px 8px rgba(0,0,0,0.1)";
              }}
            >
              <span style={{ fontSize: 28 }}>{medallas[i]}</span>
              <div style={{ flex: 1 }}>
                <span style={{ color: j.esYo ? C.naranja : "var(--texto)", fontWeight: 800, fontSize: 14, letterSpacing: "-0.3px" }}>
                  {j.nombre} {j.esYo ? "👈" : ""}
                </span>
              </div>
              <span style={{ color: C.verde, fontWeight: 900, fontSize: 15 }}>⚽ {j.goles || 0}</span>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
