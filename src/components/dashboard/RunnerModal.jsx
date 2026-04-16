const isMobile = window.innerWidth < 640;

export default function RunnerModal({ onCompletar, onCerrar }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 200, padding: isMobile ? 0 : 16, backdropFilter: "blur(4px)" }}>
      <div style={{
        background: "linear-gradient(135deg, var(--card) 0%, rgba(var(--card-rgb, 26, 17, 48), 0.98) 100%)",
        borderRadius: isMobile ? "20px 20px 0 0" : 20,
        padding: isMobile ? "14px 14px 24px" : 20,
        width: "100%",
        maxWidth: isMobile ? "100%" : 680,
        height: isMobile ? "96dvh" : "92vh",
        maxHeight: isMobile ? "96dvh" : 780,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: isMobile ? 16 : 18 }}>🐾 Runner de Mascotas</div>
            <div style={{ color: "var(--texto-sec)", fontSize: 11, marginTop: 2 }}>Juega y completa la misión para ganar goles</div>
          </div>
          <button
            onClick={onCerrar}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", fontSize: 18, cursor: "pointer", color: "var(--texto-ter)", width: 30, height: 30, borderRadius: 8 }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", marginBottom: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          <iframe
            src="https://cl-tiene-mascotas-runner-recursos-v.vercel.app/"
            title="Runner de Mascotas"
            style={{ border: "none", display: "block", width: "100%", height: "100%" }}
            allow="autoplay; fullscreen"
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCerrar}
            style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--texto-sec)", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            Cerrar
          </button>
          <button
            onClick={onCompletar}
            style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg, #16C784, #0fa968)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 16px rgba(22,199,132,0.3)" }}
          >
            ✓ Completar misión
          </button>
        </div>
      </div>
    </div>
  );
}
