import { C } from "./constants";

export default function MisionCard({ mision, reclamando, onReclamar, tituloPendiente }) {
  const puedeRepetir = mision.ok && mision.botonOkLabel;

  const botonBase = {
    marginTop: 0,
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    padding: "7px 14px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: mision.ok
          ? "linear-gradient(135deg, rgba(22,199,132,0.12) 0%, rgba(22,199,132,0.05) 100%)"
          : "linear-gradient(135deg, rgba(253,119,81,0.08) 0%, rgba(253,119,81,0.02) 100%)",
        border: mision.ok ? "2px solid rgba(22,199,132,0.4)" : "1.5px solid rgba(253,119,81,0.2)",
        borderRadius: 16,
        padding: "16px 18px",
        marginBottom: 12,
        opacity: mision.ok ? 0.9 : 1,
        boxShadow: mision.ok ? "0 4px 16px rgba(22,199,132,0.1)" : "0 2px 12px rgba(0,0,0,0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: mision.ok ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!mision.ok) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(253,119,81,0.2)";
          e.currentTarget.style.borderColor = "rgba(253,119,81,0.4)";
        }
      }}
      onMouseLeave={(e) => {
        if (!mision.ok) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.1)";
          e.currentTarget.style.borderColor = "rgba(253,119,81,0.2)";
        }
      }}
    >
      <div
        className={mision.ok ? "anim-confetti" : ""}
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          background: mision.ok
            ? "linear-gradient(135deg, rgba(22,199,132,0.25) 0%, rgba(22,199,132,0.1) 100%)"
            : "linear-gradient(135deg, rgba(253,119,81,0.15) 0%, rgba(253,119,81,0.05) 100%)",
          border: mision.ok ? "2px solid rgba(22,199,132,0.3)" : "1.5px solid rgba(253,119,81,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          flexShrink: 0,
          transition: "all 0.3s",
        }}
      >
        {mision.icono}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ color: mision.ok ? "#16C784" : tituloPendiente, fontWeight: 800, fontSize: 15 }}>
          {mision.titulo}
        </div>
        <div style={{ color: "var(--texto-ter)", fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{mision.desc}</div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <div
          style={{
            background: mision.ok ? "rgba(236,168,45,0.2)" : "rgba(236,168,45,0.15)",
            color: mision.ok ? "#ECA82D" : C.dorado,
            fontWeight: 900,
            fontSize: 15,
            padding: "6px 12px",
            borderRadius: 12,
          }}
        >
          +{mision.monedas} {"\uD83E\uDE99"}
        </div>

        {mision.ok ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ color: "#16C784", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 16 }}>{"\u2713"}</span> Completada
            </div>
            {puedeRepetir && (
              <button
                onClick={() => onReclamar(mision.id)}
                disabled={reclamando === mision.id}
                style={{
                  ...botonBase,
                  background: "rgba(22,199,132,0.18)",
                  border: "1px solid rgba(22,199,132,0.35)",
                  color: "#16C784",
                  fontWeight: 800,
                  cursor: reclamando === mision.id ? "wait" : "pointer",
                }}
              >
                {reclamando === mision.id ? "..." : mision.botonOkLabel}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onReclamar(mision.id)}
            disabled={reclamando === mision.id}
            style={{
              ...botonBase,
              background: reclamando === mision.id ? "rgba(100,100,100,0.5)" : "linear-gradient(135deg, #FD7751, #FF9066)",
              color: "#FFFFFF",
              cursor: reclamando === mision.id ? "wait" : "pointer",
              boxShadow: "0 4px 12px rgba(253,119,81,0.2)",
            }}
            onMouseEnter={(e) => {
              if (reclamando !== mision.id) {
                e.target.style.transform = "translateY(-2px) scale(1.05)";
                e.target.style.boxShadow = "0 6px 20px rgba(253,119,81,0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (reclamando !== mision.id) {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 4px 12px rgba(253,119,81,0.2)";
              }
            }}
          >
            {reclamando === mision.id ? "..." : mision.botonLabel || "Reclamar →"}
          </button>
        )}
      </div>
    </div>
  );
}
