export default function CompartirModal({ onCompartir, onCerrar, redesSociales }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "linear-gradient(135deg, var(--card) 0%, rgba(var(--card-rgb, 26, 17, 48), 0.95) 100%)", borderRadius: 20, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 18 }}>🤝 Invita Amigos</div>
            <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 2 }}>Gana ⚽ por cada registro</div>
          </div>
          <button onClick={onCerrar} style={{ background: "rgba(255,255,255,0.1)", border: "none", fontSize: 20, cursor: "pointer", color: "var(--texto-ter)", width: 32, height: 32, borderRadius: 8, hover: "all 0.2s", transition: "all 0.2s" }} onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.15)" }} onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.1)" }}>
            ✕
          </button>
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.15) 0%, rgba(236,168,45,0.05) 100%)", border: "1.5px solid rgba(236,168,45,0.3)", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "center" }}>
          <div style={{ color: "var(--texto-sec)", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>TU CÓDIGO DE REFERIDO</div>
          <div style={{ color: "#ECA82D", fontWeight: 900, fontSize: 24, letterSpacing: 3, fontFamily: "monospace" }}>ABC12XYZ</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 6 }}>Comparte este código para ganar +5 ⚽</div>
        </div>

        <div style={{ color: "var(--texto-sec)", fontSize: 13, marginBottom: 18, textAlign: "center", lineHeight: 1.5 }}>
          Comparte por tus redes sociales. Cuando alguien use tu código, ¡ganas goles!
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
          {redesSociales.map((red) => (
            <button
              key={red.id}
              onClick={() => onCompartir(red.id)}
              style={{
                padding: 18,
                borderRadius: 14,
                border: `2px solid ${red.color}40`,
                background: `linear-gradient(135deg, ${red.color}15 0%, ${red.color}05 100%)`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                e.currentTarget.style.borderColor = red.color;
                e.currentTarget.style.boxShadow = `0 8px 20px ${red.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.borderColor = `${red.color}40`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: 28 }}>{red.icono}</span>
              <span style={{ color: "var(--texto)", fontWeight: 700, fontSize: 12 }}>{red.nombre}</span>
            </button>
          ))}
        </div>

        <button onClick={onCerrar} style={{ width: "100%", padding: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--texto-sec)", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.1)" }} onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.05)" }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
