import { useState, useEffect } from "react";
import { obtenerNoticiasMundial } from "../../api/gemini";
import { C } from "./constants";

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarNoticias = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerNoticiasMundial();
      setNoticias(data);
    } catch {
      setError("No se pudieron cargar las noticias");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarNoticias(); }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>📰 Noticias del Mundial</span>
        <button onClick={cargarNoticias} disabled={cargando} style={{ background: "none", border: "none", color: C.naranja, fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
          {cargando ? "Cargando..." : "Actualizar ↻"}
        </button>
      </div>

      <div style={{ background: "rgba(64,141,255,0.1)", border: "1px solid rgba(64,141,255,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Noticias</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Lo último del Mundial 2026 actualizado para ti</div>
        </div>
      </div>

      {cargando && noticias.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: "spin 1s linear infinite" }}>⚽</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Buscando noticias...</div>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(237,30,40,0.1)", border: "1px solid rgba(237,30,40,0.3)", borderRadius: 12, padding: "16px", textAlign: "center", marginBottom: 16 }}>
          <div style={{ color: C.rojo, fontSize: 14, marginBottom: 8 }}>{error}</div>
          <button onClick={cargarNoticias} style={{ background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 16px", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      )}

      {noticias.map((n, i) => {
        const categoriaColor = {
          Selecciones: { bg: "rgba(253,119,81,0.15)", color: C.naranja },
          Sedes: { bg: "rgba(130,43,210,0.15)", color: C.morado },
          Clasificación: { bg: "rgba(64,141,255,0.15)", color: C.azul },
          Jugadores: { bg: "rgba(22,199,132,0.15)", color: C.verde },
          FIFA: { bg: "rgba(236,168,45,0.15)", color: C.dorado },
        }[n.categoria] || { bg: "rgba(255,255,255,0.1)", color: "#fff" };

        return (
          <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px", marginBottom: 14, position: "relative", overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.naranja; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(253,119,81,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Decoración de fondo */}
            <div style={{ position: "absolute", right: -15, top: -15, fontSize: 60, opacity: 0.04, userSelect: "none" }}>📰</div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {n.categoria && (
                <span style={{ background: categoriaColor.bg, color: categoriaColor.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                  {n.categoria}
                </span>
              )}
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>📅 {n.fecha || "Hoy"}</span>
            </div>

            <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 }}>{n.titulo}</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>{n.resumen}</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              {n.fuente && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: categoriaColor.color }} />
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{n.fuente}</span>
                </div>
              )}
              <span style={{ background: "linear-gradient(135deg, #FD7751, #e5622a)", padding: "5px 14px", borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 700 }}>
                Leer artículo →
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
