import { useEffect, useState } from "react";
import { obtenerInicioMundial } from "../../api/gemini";
import { useCountdown } from "../../hooks/useCountdown";
import client from "../../api/client";
import { getLogoMarca, getNombreMarca } from "../../utils/marca";
import { formatearFecha, Bandera } from "./constants";
import { useTheme } from "../../store/useTheme";

export default function Inicio({ setTab, reclamarBono, partidos, usuario }) {
  const { tema } = useTheme();
  const [inicioMundial, setInicioMundial] = useState({
    targetDate: "2026-06-11T00:00:00-05:00",
    titulo: "USA - Mexico - Canada 2026",
  });
  const [promoIndex, setPromoIndex] = useState(0);
  const [misPredicciones, setMisPredicciones] = useState([]);

  const promosClTiene = [
    {
      eyebrow: "PLAN SALUD CLTIENE",
      titulo: "Salud al instante, sin filas ni copagos",
      descripcion: "Explora el Plan Salud de CLTiene con orientación médica, traslados y atención pensada para acompañarte cuando más lo necesitas.",
      items: [
        { icono: "🩺", texto: "Orientación médica" },
        { icono: "🚑", texto: "Traslado médico" },
        { icono: "📞", texto: "Atención rápida" },
      ],
      cta: "Ver Plan Salud",
      url: "https://cltiene.com/",
      heroIcon: "🩺",
      gradient: "linear-gradient(135deg, rgba(64,141,255,0.2), rgba(22,199,132,0.14), rgba(255,255,255,0.04))",
      border: "rgba(64,141,255,0.32)",
      accent: "#7BC6FF",
      button: "linear-gradient(135deg, #408DFF, #16C784)",
    },
    {
      eyebrow: "PLAN MASCOTAS CLTIENE",
      titulo: "Veterinario en casa, sin estres ni carreras",
      descripcion: "Conoce el respaldo para tus mascotas con orientación veterinaria, visitas a domicilio y servicios pensados para su bienestar.",
      items: [
        { icono: "🐾", texto: "Veterinario en casa" },
        { icono: "💬", texto: "Orientación experta" },
        { icono: "🛁", texto: "Cuidado integral" },
      ],
      cta: "Ver Plan Mascotas",
      url: "https://cltiene.com/",
      heroIcon: "🐾",
      gradient: "linear-gradient(135deg, rgba(253,119,81,0.18), rgba(236,168,45,0.16), rgba(255,255,255,0.04))",
      border: "rgba(236,168,45,0.3)",
      accent: "#FFD27F",
      button: "linear-gradient(135deg, #FD7751, #ECA82D)",
    },
    {
      eyebrow: "PLAN MOVILIDAD CLTIENE",
      titulo: "Listos para ayudarte en cualquier camino",
      descripcion: "Descubre asistencias para carro o moto como grúa, batería, cerrajería y cambio de llanta con respaldo CLTiene.",
      items: [
        { icono: "🚗", texto: "Grua y asistencia" },
        { icono: "🔋", texto: "Batería y arranque" },
        { icono: "🛞", texto: "Cambio de llanta" },
      ],
      cta: "Ver Plan Movilidad",
      url: "https://cltiene.com/",
      heroIcon: "🚗",
      gradient: "linear-gradient(135deg, rgba(130,43,210,0.18), rgba(64,141,255,0.14), rgba(255,255,255,0.04))",
      border: "rgba(130,43,210,0.3)",
      accent: "#C69BFF",
      button: "linear-gradient(135deg, #822BD2, #408DFF)",
    },
    {
      eyebrow: "PLAN PREMIUM CLTIENE",
      titulo: "Todo lo que necesitas, en un solo lugar",
      descripcion: "Explora el Plan Premium con soluciones combinadas para salud, hogar, mascotas y asistencia integral 24/7.",
      items: [
        { icono: "⭐", texto: "Cobertura amplia" },
        { icono: "🏠", texto: "Asistencia en casa" },
        { icono: "🛡️", texto: "Respaldo 24/7" },
      ],
      cta: "Ver Plan Premium",
      url: "https://cltiene.com/",
      heroIcon: "⭐",
      gradient: "linear-gradient(135deg, rgba(236,168,45,0.2), rgba(253,119,81,0.14), rgba(130,43,210,0.1))",
      border: "rgba(253,119,81,0.28)",
      accent: "#FFD27F",
      button: "linear-gradient(135deg, #FD7751, #ED1E28)",
    },
  ];

  const promoActual = promosClTiene[promoIndex];
  const proximos = partidos.filter((p) => p.estado === "pendiente").slice(0, 3);
  const tiempo = useCountdown(inicioMundial.targetDate);
  const esTemaClaro = tema === "claro";

  // Cargar predicciones del usuario
  const cargarMisPredicciones = async () => {
    try {
      if (usuario?.uid) {
        const res = await client.get(`/predicciones/${usuario.uid}`);
        setMisPredicciones(res.data.slice(0, 3)); 
      }
    } catch {}
  };

  useEffect(() => {
    let activo = true;

    obtenerInicioMundial()
      .then((data) => {
        if (activo && data?.targetDate) setInicioMundial(data);
      })
      .catch(() => {});

    if (usuario?.uid) {
      cargarMisPredicciones();
    }

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPromoIndex((actual) => (actual + 1) % promosClTiene.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [promosClTiene.length]);

  return (
    <div>
      <div
        style={{
          background: esTemaClaro
            ? "linear-gradient(135deg, #7b2cbf, #5a189a)"
            : "linear-gradient(135deg, #7c1a8c, #1a0f3d)",
          border: esTemaClaro
            ? "1px solid rgba(123,44,191,0.45)"
            : "1px solid rgba(130,43,210,0.5)",
          borderRadius: 16,
          padding: "18px 16px",
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: 0.1 }}>🌎</div>
        <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, marginBottom: 8 }}>El torneo comienza en</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 12 }}>
          {[
            [tiempo.dias, "DIAS"],
            [tiempo.horas, "HRS"],
            [tiempo.minutos, "MIN"],
            [tiempo.segundos, "SEG"],
          ].map(([numero, label]) => (
            <div key={label} style={{ background: esTemaClaro ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.3)", border: esTemaClaro ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{numero}</div>
              <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 10 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 14 }}>
          {tiempo.finalizado ? "El torneo ya comenzo" : `Inicio oficial: ${inicioMundial.titulo}`}
        </div>
      </div>

      {usuario?.empresa_id && usuario.empresa_id === 1 && (
      <div
        className="micro-card anim-stadium-glow"
        style={{
          background: promoActual.gradient,
          border: `1px solid ${promoActual.border}`,
          borderRadius: 16,
          padding: "16px",
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ position: "absolute", right: -12, top: -8, fontSize: 74, opacity: 0.1 }}>{promoActual.heroIcon}</div>
        
        {/* Botones de navegación del carrusel */}
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6, zIndex: 10 }}>
          <button
            onClick={() => setPromoIndex((prev) => (prev - 1 + promosClTiene.length) % promosClTiene.length)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255,255,255,0.25)";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255,255,255,0.12)";
              e.target.style.transform = "scale(1)";
            }}
          >
            ‹
          </button>
          <button
            onClick={() => setPromoIndex((prev) => (prev + 1) % promosClTiene.length)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255,255,255,0.25)";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255,255,255,0.12)";
              e.target.style.transform = "scale(1)";
            }}
          >
            ›
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <img src={getLogoMarca()} alt={getNombreMarca()} style={{ width: 28, height: 28, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ color: promoActual.accent, fontSize: 11, fontWeight: 800, letterSpacing: 0.6 }}>{promoActual.eyebrow}</div>
            <div className="anim-slide-up" style={{ color: "var(--texto)", fontSize: 17, fontWeight: 900 }}>{promoActual.titulo}</div>
          </div>
        </div>
        <div className="anim-slide-up" style={{ color: "var(--texto-sec)", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
          {promoActual.descripcion}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
          {promoActual.items.map((item) => (
            <div 
              key={item.texto} 
              style={{ 
                background: "rgba(255,255,255,0.06)", 
                border: "1px solid rgba(255,255,255,0.08)", 
                borderRadius: 12, 
                padding: "10px 8px", 
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icono}</div>
              <div style={{ color: "var(--texto)", fontSize: 11, fontWeight: 700 }}>{item.texto}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 10 }}>
          <a
            href={promoActual.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "10px 12px",
              background: promoActual.button,
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 8px 22px rgba(253,119,81,0.22)",
              textDecoration: "none",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 12px 28px rgba(253,119,81,0.32)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 8px 22px rgba(253,119,81,0.22)";
            }}
          >
            {promoActual.cta}
          </a>
          <button
            onClick={() => setTab("beneficios")}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              color: "var(--texto)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255,255,255,0.15)";
              e.target.style.borderColor = "rgba(255,255,255,0.25)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255,255,255,0.08)";
              e.target.style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            Ver en la app
          </button>
        </div>

        {/* Indicadores del carrusel */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {promosClTiene.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPromoIndex(idx)}
              style={{
                width: promoIndex === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: promoIndex === idx ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>
      </div>
      )}

      {misPredicciones.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 16, marginBottom: 10 }}>📊 Mis predicciones recientes</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {misPredicciones.map((pred) => {
              const getEstadoColor = (estado) => {
                switch (estado) {
                  case "acertada_especial":
                    return { bg: "rgba(236,168,45,0.2)", border: "rgba(236,168,45,0.4)", icon: "🎯", label: "Exacto" };
                  case "acertada_simple":
                    return { bg: "rgba(22,199,132,0.2)", border: "rgba(22,199,132,0.4)", icon: "✅", label: "Acertada" };
                  case "fallida":
                    return { bg: "rgba(253,119,81,0.2)", border: "rgba(253,119,81,0.4)", icon: "❌", label: "Fallida" };
                  default:
                    return { bg: "rgba(64,141,255,0.2)", border: "rgba(64,141,255,0.4)", icon: "⏳", label: "Pendiente" };
                }
              };
              const estado = getEstadoColor(pred.estado);
              return (
                <div
                  key={pred.id}
                  style={{
                    background: estado.bg,
                    border: `1px solid ${estado.border}`,
                    borderRadius: 12,
                    padding: "10px",
                    textAlign: "center",
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{estado.icon}</div>
                  <div style={{ color: "var(--texto)", fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>
                    {pred.partido?.local_equipo || "?"} vs {pred.partido?.visitante_equipo || "?"}
                  </div>
                  <div style={{ color: "var(--texto-ter)", fontSize: 9, marginTop: 2 }}>{estado.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: "var(--texto)", fontWeight: 800, fontSize: 16 }}>⚽ Proximos partidos</span>
        <button onClick={() => setTab("polla")} style={{ background: "none", border: "none", color: "#FD7751", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
          Predecir todos →
        </button>
      </div>

      {proximos.length === 0 ? (
        <div style={{ color: "var(--texto-ter)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
          Cargando partidos...
        </div>
      ) : (
        proximos.map((p, idx) => (
          <div
            key={p.id}
            className="anim-slide-up micro-card"
            onClick={() => setTab("polla")}
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 10,
              animationDelay: `${idx * 0.1}s`,
              animationFillMode: "both",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(253,119,81,0.3)";
              e.currentTarget.style.background = "rgba(253,119,81,0.05)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--card-border)";
              e.currentTarget.style.background = "var(--card)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
              <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                Grupo {p.grupo}
              </span>
              <span style={{ color: "var(--texto-ter)", fontSize: 12 }}>📅 {formatearFecha(p.fecha)} · {p.hora}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "center" }}>
                <Bandera codigo={p.bandera_l} nombre={p.local} />
                <div style={{ color: "var(--texto)", fontWeight: 700, fontSize: 13, marginTop: 6 }}>{p.local}</div>
              </div>
              <div style={{ background: "var(--card)", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ color: "var(--texto-ter)", fontSize: 11 }}>VS</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <Bandera codigo={p.bandera_v} nombre={p.visitante} />
                <div style={{ color: "var(--texto)", fontWeight: 700, fontSize: 13, marginTop: 6 }}>{p.visitante}</div>
              </div>
            </div>
            <div style={{
              marginTop: 10, padding: "8px", borderRadius: 10, textAlign: "center",
              background: "linear-gradient(135deg, #FD7751, #e5622a)",
              color: "#fff", fontWeight: 700, fontSize: 13,
            }}>
              ⚽ Predecir este partido
            </div>
          </div>
        ))
      )}

      <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.2), rgba(253,119,81,0.1))", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 14, padding: "16px", marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(236,168,45,0.2)";
          e.currentTarget.style.borderColor = "rgba(236,168,45,0.6)";
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(236,168,45,0.3), rgba(253,119,81,0.15))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "rgba(236,168,45,0.4)";
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(236,168,45,0.2), rgba(253,119,81,0.1))";
        }}
      >
        <div>
          <div style={{ color: "#ECA82D", fontWeight: 800, fontSize: 15 }}>🪙 Bono diario</div>
          <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 3 }}>Tienes monedas esperandote</div>
        </div>
        <button 
          className="anim-pulse" 
          onClick={reclamarBono} 
          style={{ 
            background: "linear-gradient(135deg, #ECA82D, #c9891a)", 
            border: "none", 
            borderRadius: 10, 
            color: "#231F20", 
            fontWeight: 800, 
            fontSize: 14, 
            padding: "10px 18px", 
            cursor: "pointer", 
            boxShadow: "0 4px 16px rgba(236,168,45,0.4)",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.08)";
            e.target.style.boxShadow = "0 6px 24px rgba(236,168,45,0.6)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 4px 16px rgba(236,168,45,0.4)";
          }}
        >
          Reclamar
        </button>
      </div>
    </div>
  );
}
