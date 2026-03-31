import { useEffect, useMemo, useState } from "react";
import { obtenerInicioMundial } from "../../api/gemini";
import { useCountdown } from "../../hooks/useCountdown";
import { getLogoMarca, getNombreMarca, getPublicidadMarca } from "../../utils/marca";
import { useTheme } from "../../store/useTheme";

export default function Inicio({ setTab, reclamarBono, partidos, usuario }) {
  useTheme();
  const [inicioMundial, setInicioMundial] = useState({
    targetDate: "2026-06-11T00:00:00-05:00",
    titulo: "USA - Mexico - Canada 2026",
  });
  const [promoIndex, setPromoIndex] = useState(0);

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

  const promosMarca = getPublicidadMarca();
  const promosFinal = promosMarca.length
    ? promosMarca
    : (usuario?.empresa_id === 1 ? promosClTiene : []);
  const promoActual = promosFinal[promoIndex % Math.max(promosFinal.length, 1)];
  const grupos = useMemo(() => {
    const mapa = new Map();
    (partidos || []).forEach((p) => {
      if (!p?.grupo) return;
      const grupoKey = String(p.grupo).toUpperCase();
      if (!mapa.has(grupoKey)) mapa.set(grupoKey, new Map());
      const equipos = mapa.get(grupoKey);
      const agregarEquipo = (nombre, bandera) => {
        if (!nombre) return;
        if (!equipos.has(nombre)) {
          equipos.set(nombre, {
            nombre,
            bandera,
            pj: 0,
            g: 0,
            e: 0,
            p: 0,
            gf: 0,
            gc: 0,
            dg: 0,
            pts: 0,
          });
        }
      };
      agregarEquipo(p.local, p.bandera_l);
      agregarEquipo(p.visitante, p.bandera_v);

      const tieneMarcador =
        typeof p.goles_local === "number" && typeof p.goles_visitante === "number";
      if (tieneMarcador) {
        const localEq = equipos.get(p.local);
        const visEq = equipos.get(p.visitante);
        if (localEq && visEq) {
          localEq.pj += 1;
          visEq.pj += 1;
          localEq.gf += p.goles_local;
          localEq.gc += p.goles_visitante;
          visEq.gf += p.goles_visitante;
          visEq.gc += p.goles_local;

          if (p.goles_local > p.goles_visitante) {
            localEq.g += 1;
            visEq.p += 1;
            localEq.pts += 3;
          } else if (p.goles_local < p.goles_visitante) {
            visEq.g += 1;
            localEq.p += 1;
            visEq.pts += 3;
          } else {
            localEq.e += 1;
            visEq.e += 1;
            localEq.pts += 1;
            visEq.pts += 1;
          }
        }
      }
    });

    return Array.from(mapa.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([grupo, equipos]) => ({
        grupo,
        equipos: Array.from(equipos.values())
          .map((eq) => ({ ...eq, dg: eq.gf - eq.gc }))
          .sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.dg !== a.dg) return b.dg - a.dg;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return a.nombre.localeCompare(b.nombre);
          }),
      }));
  }, [partidos]);
  const tiempo = useCountdown(inicioMundial.targetDate);


  useEffect(() => {
    let activo = true;

    obtenerInicioMundial()
      .then((data) => {
        if (activo && data?.targetDate) setInicioMundial(data);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!promosFinal.length) return;
    const intervalId = window.setInterval(() => {
      setPromoIndex((actual) => (actual + 1) % promosFinal.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [promosFinal.length]);

  return (
    <div>
      <div
        style={{
          background: `linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))`,
          border: `1px solid rgba(var(--brand-primary-rgb), 0.45)`,
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
            <div key={label} style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{numero}</div>
              <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 10 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 14 }}>
          {tiempo.finalizado ? "El torneo ya comenzo" : `Inicio oficial: ${inicioMundial.titulo}`}
        </div>
      </div>

      {promosFinal.length > 0 && promoActual && (
      <div
        className="micro-card anim-stadium-glow"
        style={{
          background: promoActual.gradient || "linear-gradient(135deg, rgba(64,141,255,0.2), rgba(22,199,132,0.14), rgba(255,255,255,0.04))",
          border: `1px solid ${promoActual.border || "rgba(64,141,255,0.32)"}`,
          borderRadius: 16,
          padding: "16px",
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ position: "absolute", right: -12, top: -8, fontSize: 74, opacity: 0.1 }}>{promoActual.heroIcon || "⭐"}</div>
        
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
            <div style={{ color: promoActual.accent || "var(--brand-accent)", fontSize: 11, fontWeight: 800, letterSpacing: 0.6 }}>{promoActual.eyebrow || "PROMO"}</div>
            <div className="anim-slide-up" style={{ color: "var(--texto)", fontSize: 17, fontWeight: 900 }}>{promoActual.titulo || "Beneficios para ti"}</div>
          </div>
        </div>
        <div className="anim-slide-up" style={{ color: "var(--texto-sec)", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
          {promoActual.descripcion || "Conoce los beneficios y servicios disponibles para tu empresa."}
        </div>
        {Array.isArray(promoActual.items) && promoActual.items.length > 0 && (
          <CarruselItems items={promoActual.items} />
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 10 }}>
          <a
            href={promoActual.url || "https://cltiene.com/"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "10px 12px",
              background: promoActual.button || "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
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
            {promoActual.cta || "Conocer más"}
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
          {promosFinal.map((_, idx) => (
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

      {grupos.length > 0 && (
        <TablaGrupos grupos={grupos} />
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

function CarruselItems({ items }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  const item = items[idx];
  if (!item) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        key={idx}
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "14px 16px",
          textAlign: "center",
          animation: "fadeSlideIn 0.4s ease",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icono}</div>
        <div style={{ color: "var(--texto)", fontSize: 13, fontWeight: 800 }}>{item.texto}</div>
        {item.descripcion && (
          <div style={{ color: "var(--texto-sec)", fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>{item.descripcion}</div>
        )}
      </div>
      {items.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: idx === i ? 18 : 6, height: 6, borderRadius: 3,
                background: idx === i ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0,
              }}
            />
          ))}
        </div>
      )}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function TablaGrupos({ grupos }) {
  const [grupoActivo, setGrupoActivo] = useState(0);
  const grupo = grupos[grupoActivo];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: "var(--texto)", fontWeight: 800, fontSize: 16 }}>🏆 Tabla de grupos</span>
        <span style={{ color: "var(--texto-ter)", fontSize: 12 }}>Mundial 2026</span>
      </div>

      {/* Tabs de grupos */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
        {grupos.map((g, i) => (
          <button
            key={g.grupo}
            onClick={() => setGrupoActivo(i)}
            style={{
              padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap",
              cursor: "pointer", fontSize: 12, fontWeight: 700, border: "none",
              background: grupoActivo === i ? "rgba(var(--brand-primary-rgb), 0.2)" : "rgba(255,255,255,0.06)",
              color: grupoActivo === i ? "var(--brand-primary)" : "var(--texto-sec)",
              transition: "all 0.2s",
            }}
          >
            Grupo {g.grupo}
          </button>
        ))}
      </div>

      {/* Tabla del grupo activo */}
      {grupo && (
        <div
          key={grupo.grupo}
          style={{
            background: "rgba(0,0,0,0.28)",
            border: "1px solid rgba(var(--brand-primary-rgb), 0.22)",
            borderRadius: 14,
            padding: "14px 14px 10px",
            animation: "fadeSlideIn 0.3s ease",
          }}
        >
          <div style={{ color: "var(--brand-primary)", fontWeight: 800, fontSize: 15, marginBottom: 10 }}>
            Grupo {grupo.grupo}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
              <thead>
                <tr style={{ color: "var(--texto-ter)", fontSize: 11 }}>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600 }}>Equipo</th>
                  {["PJ", "G", "E", "P", "GF", "GC", "PTS"].map((h) => (
                    <th key={h} style={{ textAlign: "center", padding: "4px 4px", fontWeight: 600, width: 30 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grupo.equipos.map((eq) => (
                  <tr key={eq.nombre} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "8px 6px", display: "flex", alignItems: "center", gap: 8 }}>
                      <img
                        src={`https://flagcdn.com/24x18/${(eq.bandera || "").toLowerCase()}.png`}
                        alt={eq.nombre}
                        style={{ width: 24, height: 18, objectFit: "cover", borderRadius: 2 }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <span style={{ color: "var(--texto)", fontSize: 13, fontWeight: 700 }}>{eq.nombre}</span>
                    </td>
                    {[eq.pj, eq.g, eq.e, eq.p, eq.gf, eq.gc].map((v, i) => (
                      <td key={i} style={{ textAlign: "center", color: "var(--texto)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{v}</td>
                    ))}
                    <td style={{ textAlign: "center", color: "var(--brand-accent)", fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{eq.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
