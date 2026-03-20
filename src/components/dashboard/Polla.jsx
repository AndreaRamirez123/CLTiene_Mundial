import { useState, useEffect } from "react";
import client from "../../api/client";
import { C, formatearFecha, Bandera } from "./constants";

const MENSAJES_POSITIVOS = [
  "¡Sigue así! La próxima será tuya 💪",
  "¡El fútbol es impredecible! Eso lo hace emocionante ⚽",
  "¡No te rindas! Los grandes jugadores siempre insisten 🔥",
  "¡Cada predicción te acerca más al top! 🏆",
  "¡El Mundial recién empieza! Hay muchas oportunidades 🌟",
];

export default function Polla({ usuario, cargarPerfil, partidos }) {
  const [preds, setPreds] = useState({});
  const [enviando, setEnviando] = useState({});
  const [misPredicciones, setMisPredicciones] = useState([]);
  const [verTab, setVerTab] = useState("predecir");

  const set = (id, k, v) => setPreds((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  const cargarMisPredicciones = async () => {
    try {
      const res = await client.get(`/predicciones/${usuario.uid}`);
      setMisPredicciones(res.data);
    } catch { /* silenciar */ }
  };

  useEffect(() => {
    if (usuario?.uid) cargarMisPredicciones();
  }, [usuario?.uid]);

  const confirmar = async (partido) => {
    const pred = preds[partido.id];
    if (!pred?.resultado) { alert("Selecciona un resultado (Local / Empate / Visitante)"); return; }
    setEnviando((e) => ({ ...e, [partido.id]: true }));
    try {
      const res = await client.post(`/predicciones/${usuario.uid}`, {
        partido_id: String(partido.id),
        resultado: pred.resultado,
        goles_local: Number(pred.gl) || 0,
        goles_visitante: Number(pred.gv) || 0,
        monedas_apostadas: 0,
      });
      alert(res.data.mensaje);
      await cargarPerfil();
      await cargarMisPredicciones();
    } catch (e) {
      alert(e.response?.data?.message || "Error al guardar predicción");
    } finally {
      setEnviando((e) => ({ ...e, [partido.id]: false }));
    }
  };

  // Partidos donde aún no tengo predicción
  const idsPredichos = new Set(misPredicciones.map(p => p.partido_id));
  const pendientes = partidos.filter(p => p.estado === "pendiente" && !idsPredichos.has(p.id));

  // Agrupar por fecha para filtrar
  const fechasDisponibles = [...new Set(pendientes.map(p => p.fecha))].sort();
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const partidosFiltrados = fechaSeleccionada
    ? pendientes.filter(p => p.fecha === fechaSeleccionada)
    : pendientes.slice(0, 4); // Mostrar solo 4 si no hay filtro

  const getMensajePositivo = (idx) => MENSAJES_POSITIVOS[idx % MENSAJES_POSITIVOS.length];

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case "acertada_especial": return { texto: "¡Marcador exacto! 🎯", color: "#ECA82D", bg: "rgba(236,168,45,0.15)" };
      case "acertada_simple": return { texto: "¡Resultado acertado! ✅", color: C.verde, bg: "rgba(22,199,132,0.1)" };
      case "fallida": return { texto: "", color: C.naranja, bg: "rgba(253,119,81,0.08)" };
      default: return { texto: "Pendiente ⏳", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.04)" };
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "predecir", label: "Predecir", icono: "⚽" },
          { id: "mis", label: `Mis predicciones (${misPredicciones.length})`, icono: "📋" },
        ].map((t) => (
          <button key={t.id} onClick={() => setVerTab(t.id)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: verTab === t.id ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.1)", background: verTab === t.id ? "rgba(253,119,81,0.15)" : "rgba(255,255,255,0.04)", color: verTab === t.id ? "#FD7751" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {t.icono} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Predecir */}
      {verTab === "predecir" && (
        <div>
          <div style={{ background: "rgba(64,141,255,0.1)", border: "1px solid rgba(64,141,255,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <div style={{ color: "var(--texto)", fontWeight: 700, fontSize: 13 }}>Predicciones gratuitas</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Si aciertas resultado ganas +50 🪙 · Marcador exacto +100 🪙</div>
            </div>
          </div>

          {/* Filtro por fecha */}
          {fechasDisponibles.length > 0 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
              <button onClick={() => setFechaSeleccionada("")} style={{ padding: "6px 12px", borderRadius: 20, border: !fechaSeleccionada ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.1)", background: !fechaSeleccionada ? "rgba(253,119,81,0.2)" : "rgba(255,255,255,0.04)", color: !fechaSeleccionada ? "#FD7751" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
                Próximos
              </button>
              {fechasDisponibles.map(f => (
                <button key={f} onClick={() => setFechaSeleccionada(f)} style={{ padding: "6px 12px", borderRadius: 20, border: fechaSeleccionada === f ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.1)", background: fechaSeleccionada === f ? "rgba(253,119,81,0.2)" : "rgba(255,255,255,0.04)", color: fechaSeleccionada === f ? "#FD7751" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {formatearFecha(f)}
                </button>
              ))}
            </div>
          )}

          {partidosFiltrados.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              {partidos.length === 0 ? "Cargando partidos..." : "¡Ya predijiste todos los partidos disponibles! 🎉"}
            </div>
          ) : partidosFiltrados.map((p, idx) => (
            <div key={p.id} className="anim-slide-up" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px", marginBottom: 14, animationDelay: `${idx * 0.08}s`, animationFillMode: "both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Grupo {p.grupo}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>📅 {formatearFecha(p.fecha)} · {p.hora}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <Bandera codigo={p.bandera_l} nombre={p.local} size={36} />
                  <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 14, marginTop: 6 }}>{p.local}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px" }}>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700 }}>VS</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <Bandera codigo={p.bandera_v} nombre={p.visitante} size={36} />
                  <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 14, marginTop: 6 }}>{p.visitante}</div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>¿Quién gana?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { val: "local", label: p.local, codigo: p.bandera_l },
                    { val: "empate", label: "Empate", codigo: null },
                    { val: "visitante", label: p.visitante, codigo: p.bandera_v },
                  ].map((op) => (
                    <button key={op.val} onClick={() => set(p.id, "resultado", op.val)} style={{ padding: "10px 6px", borderRadius: 10, cursor: "pointer", border: preds[p.id]?.resultado === op.val ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.1)", background: preds[p.id]?.resultado === op.val ? "rgba(253,119,81,0.2)" : "rgba(255,255,255,0.04)", color: preds[p.id]?.resultado === op.val ? "#FD7751" : "rgba(255,255,255,0.6)", fontWeight: preds[p.id]?.resultado === op.val ? 800 : 400, fontSize: 12, textAlign: "center" }}>
                      <div style={{ marginBottom: 3, display: "flex", justifyContent: "center" }}>
                        {op.codigo ? <Bandera codigo={op.codigo} nombre={op.label} size={24} /> : <span style={{ fontSize: 18 }}>🤝</span>}
                      </div>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 6, fontWeight: 700 }}>Marcador exacto (opcional, +100 🪙)</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="number" min="0" max="20" placeholder="0" value={preds[p.id]?.gl || ""} onChange={(e) => set(p.id, "gl", e.target.value)} style={{ width: 56, padding: "8px", textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "var(--texto)", fontSize: 16, outline: "none" }} />
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, fontWeight: 700 }}>-</span>
                  <input type="number" min="0" max="20" placeholder="0" value={preds[p.id]?.gv || ""} onChange={(e) => set(p.id, "gv", e.target.value)} style={{ width: 56, padding: "8px", textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "var(--texto)", fontSize: 16, outline: "none" }} />
                </div>
              </div>

              <button onClick={() => confirmar(p)} disabled={enviando[p.id]} style={{ width: "100%", padding: "12px", background: enviando[p.id] ? "rgba(253,119,81,0.5)" : "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 12, color: "var(--texto)", fontWeight: 800, fontSize: 15, cursor: enviando[p.id] ? "not-allowed" : "pointer" }}>
                {enviando[p.id] ? "Guardando..." : "⚽ Confirmar predicción"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Mis predicciones */}
      {verTab === "mis" && (
        <div>
          {misPredicciones.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              Aún no has hecho predicciones. ¡Empieza ahora! ⚽
            </div>
          ) : misPredicciones.map((pred, idx) => {
            const partido = pred.partido || {};
            const info = getEstadoLabel(pred.estado);
            return (
              <div key={pred.id} className="anim-slide-up" style={{ background: info.bg, border: `1px solid ${info.color}30`, borderRadius: 14, padding: "14px 16px", marginBottom: 10, animationDelay: `${idx * 0.06}s`, animationFillMode: "both" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                    Grupo {partido.grupo} · {formatearFecha(partido.fecha)}
                  </span>
                  {pred.monedas_ganadas > 0 && (
                    <span className="anim-coin" style={{ color: C.dorado, fontWeight: 900, fontSize: 14 }}>+{pred.monedas_ganadas} 🪙</span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Bandera codigo={partido.bandera_local} nombre={partido.local_equipo} size={24} />
                  <span style={{ color: "var(--texto)", fontWeight: 700, fontSize: 13, flex: 1 }}>
                    {partido.local_equipo} vs {partido.visitante_equipo}
                  </span>
                  <Bandera codigo={partido.bandera_visitante} nombre={partido.visitante_equipo} size={24} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Tu predicción: <span style={{ color: "var(--texto)", fontWeight: 700 }}>
                      {pred.resultado === "local" ? partido.local_equipo : pred.resultado === "visitante" ? partido.visitante_equipo : "Empate"}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}> ({pred.goles_local}-{pred.goles_visitante})</span>
                  </div>
                </div>

                {/* Estado con mensaje positivo */}
                {pred.estado !== "pendiente" && (
                  <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: `${info.color}15` }}>
                    {pred.estado === "fallida" ? (
                      <div>
                        <div style={{ color: info.color, fontWeight: 700, fontSize: 12 }}>
                          Resultado real: {partido.goles_local} - {partido.goles_visitante}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>
                          {getMensajePositivo(idx)}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: info.color, fontWeight: 700, fontSize: 13 }}>
                        {info.texto}
                        {pred.estado === "acertada_especial" && " ¡Increíble!"}
                      </div>
                    )}
                  </div>
                )}

                {pred.estado === "pendiente" && (
                  <div style={{ marginTop: 6, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                    ⏳ Esperando resultado del partido
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
