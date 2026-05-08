import { useEffect, useState } from "react";

const isMobile = window.innerWidth < 640;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const RUNNER_EMBED_URL = `${API_BASE_URL}/misiones/runner/embed`;

export default function RunnerModal({ onCompletar, onCerrar }) {
  const [juegoCompleto, setJuegoCompleto] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      const data = event?.data;
      const texto = typeof data === "string" ? data : JSON.stringify(data || {});
      const completo =
        data?.runnerComplete === true ||
        data?.gameComplete === true ||
        data?.completed === true ||
        /runnerComplete|game over|juego terminado|terminado|completado|finished|complete/i.test(texto);

      if (completo) {
        setJuegoCompleto(true);
      }

      if (data?.runnerClose === true || /runnerClose/i.test(texto)) {
        onCerrar?.();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onCerrar]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 200, padding: isMobile ? 0 : 16, backdropFilter: "blur(4px)" }}>
      <div style={{
        background: "linear-gradient(135deg, var(--card) 0%, rgba(var(--card-rgb, 26, 17, 48), 0.98) 100%)",
        borderRadius: isMobile ? "20px 20px 0 0" : 20,
        padding: isMobile ? "14px 14px 24px" : 20,
        width: "100%",
        maxWidth: isMobile ? "100%" : 680,
        height: isMobile ? "96dvh" : "calc(100dvh - 32px)",
        maxHeight: isMobile ? "96dvh" : "calc(100dvh - 32px)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: isMobile ? 16 : 18 }}>Runner de Mascotas</div>
            <div style={{ color: "var(--texto-sec)", fontSize: 11, marginTop: 2 }}>Juega y completa la misión para ganar monedas</div>
          </div>
          <button
            onClick={onCerrar}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", fontSize: 18, cursor: "pointer", color: "var(--texto-ter)", width: 30, height: 30, borderRadius: 8 }}
          >
            X
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, borderRadius: 12, overflow: "hidden", marginBottom: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          <iframe
            src={RUNNER_EMBED_URL}
            title="Runner de Mascotas"
            style={{ border: "none", display: "block", width: "100%", height: "100%" }}
            allow="autoplay; fullscreen"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: "var(--texto-sec)", fontSize: 12, textAlign: "center", marginBottom: 6 }}>
            {juegoCompleto
              ? "Juego completado. Ya puedes reclamar la misión."
              : "Termina el juego para habilitar el botón de completar misión."}
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
              disabled={!juegoCompleto}
              style={{
                flex: 2,
                padding: "11px",
                background: juegoCompleto ? "linear-gradient(135deg, #16C784, #0fa968)" : "rgba(22,199,132,0.22)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontWeight: 800,
                fontSize: 13,
                cursor: juegoCompleto ? "pointer" : "not-allowed",
                boxShadow: juegoCompleto ? "0 4px 16px rgba(22,199,132,0.3)" : "none",
                opacity: juegoCompleto ? 1 : 0.55,
              }}
            >
              Completar misión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
