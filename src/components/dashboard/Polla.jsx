import { useState, useEffect } from "react";
import client from "../../api/client";
import { C, formatearFecha, Bandera } from "./constants";

const MENSAJES_POSITIVOS = [
  "Sigue así, la próxima será tuya",
  "El fútbol es impredecible, eso lo hace emocionante",
  "No te rindas, los grandes jugadores insisten",
  "Cada predicción te acerca más al top",
  "El Mundial apenas empieza, todavía hay muchas oportunidades",
];

export default function Polla({ usuario, cargarPerfil, partidos }) {
  const bordeSuave = "1px solid var(--input-border)";
  const fondoSuave = "var(--input-bg)";
  const textoSuave = "var(--texto-sec)";
  const textoSuaveFuerte = "var(--texto-sec)";

  const [preds, setPreds] = useState({});
  const [enviando, setEnviando] = useState({});
  const [misPredicciones, setMisPredicciones] = useState([]);
  const [verTab, setVerTab] = useState("predecir");
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [editando, setEditando] = useState(null); // { pred, partido, resultado, gl, gv }
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [mensajeOk, setMensajeOk] = useState("");

  const set = (id, k, v) => setPreds((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  const cargarMisPredicciones = async () => {
    try {
      const res = await client.get(`/predicciones/${usuario.uid}`);
      setMisPredicciones(res.data);
    } catch {}
  };

  useEffect(() => {
    if (usuario?.uid) cargarMisPredicciones();
  }, [usuario?.uid]);

  const mostrarOk = (msg) => {
    setMensajeOk(msg);
    setTimeout(() => setMensajeOk(""), 4500);
  };

  const confirmar = async (partido) => {
    const pred = preds[partido.id];
    if (!pred?.resultado) {
      alert("Selecciona un resultado");
      return;
    }

    setEnviando((e) => ({ ...e, [partido.id]: true }));
    try {
      const res = await client.post(`/predicciones/${usuario.uid}`, {
        partido_id: String(partido.id),
        resultado: pred.resultado,
        goles_local: Number(pred.gl) || 0,
        goles_visitante: Number(pred.gv) || 0,
      });
      mostrarOk(res.data.mensaje);
      await cargarPerfil();
      await cargarMisPredicciones();
    } catch (e) {
      alert(e.response?.data?.message || "Error al guardar predicción");
    } finally {
      setEnviando((e) => ({ ...e, [partido.id]: false }));
    }
  };

  const esBloqueado = (partido) => {
    if (!partido?.fecha || !partido?.hora) return false;
    const [year, month, day] = partido.fecha.split('-').map(Number);
    const [hour, minute] = (partido.hora || '00:00').split(':').map(Number);
    // La hora se almacena en hora colombiana (UTC-5), igual que el backend
    const inicio = new Date(Date.UTC(year, month - 1, day, hour + 5, minute));
    return Date.now() >= inicio.getTime() - 5 * 60 * 1000;
  };

  const abrirEdicion = (pred) => {
    if (esBloqueado(pred.partido)) {
      alert("Las predicciones se cierran 5 minutos antes del inicio del partido.");
      return;
    }
    setEditando({
      partido_id: pred.partido_id,
      partido: pred.partido,
      resultado: pred.resultado,
      gl: String(pred.goles_local ?? 0),
      gv: String(pred.goles_visitante ?? 0),
    });
  };

  const guardarEdicion = async () => {
    if (esBloqueado(editando?.partido)) {
      alert("Las predicciones se cierran 5 minutos antes del inicio del partido.");
      setEditando(null);
      return;
    }
    if (!editando?.resultado) {
      alert("Selecciona un resultado");
      return;
    }
    setGuardandoEdicion(true);
    try {
      const res = await client.put(
        `/predicciones/${usuario.uid}/${editando.partido_id}`,
        {
          resultado: editando.resultado,
          goles_local: Number(editando.gl) || 0,
          goles_visitante: Number(editando.gv) || 0,
        },
      );
      setEditando(null);
      mostrarOk(res.data.mensaje);
      await cargarMisPredicciones();
    } catch (e) {
      alert(e.response?.data?.message || "Error al editar predicción");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const idsPredichos = new Set(misPredicciones.map((p) => p.partido_id));
  const pendientes = partidos.filter(
    (p) => p.estado === "pendiente" && !idsPredichos.has(p.id) && !esBloqueado(p),
  );
  const fechasDisponibles = [...new Set(pendientes.map((p) => p.fecha))].sort();
  const partidosFiltrados = fechaSeleccionada
    ? pendientes.filter((p) => p.fecha === fechaSeleccionada)
    : pendientes.slice(0, 4);

  const getMensajePositivo = (idx) => MENSAJES_POSITIVOS[idx % MENSAJES_POSITIVOS.length];

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case "acertada_especial":
        return { texto: "Marcador exacto", color: "#ECA82D", bg: "rgba(236,168,45,0.15)", anim: "" };
      case "acertada_simple":
        return { texto: "Resultado acertado", color: C.verde, bg: "rgba(22,199,132,0.1)", anim: "" };
      case "fallida":
        return { texto: "", color: C.naranja, bg: "rgba(253,119,81,0.08)", anim: "" };
      default:
        return { texto: "Pendiente", color: "var(--texto-sec)", bg: fondoSuave, anim: "" };
    }
  };

  return (
    <div>
      {mensajeOk && (
        <div
          className="anim-slide-up"
          style={{
            background: "linear-gradient(135deg, rgba(22,199,132,0.18), rgba(22,199,132,0.06))",
            border: "1.5px solid rgba(22,199,132,0.45)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
            color: "#16C784",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{mensajeOk}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "predecir", label: "Predecir", icono: "⚽" },
          { id: "mis", label: `Mis predicciones (${misPredicciones.length})`, icono: "📋" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setVerTab(t.id)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: verTab === t.id ? "2px solid #FD7751" : bordeSuave,
              background: verTab === t.id ? "rgba(253,119,81,0.15)" : fondoSuave,
              color: verTab === t.id ? "#FD7751" : textoSuaveFuerte,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t.icono} {t.label}
          </button>
        ))}
      </div>

      {verTab === "predecir" && (
        <div>
          <div
            className="micro-card anim-stadium-glow"
            style={{
              background: "rgba(64,141,255,0.1)",
              border: "1px solid rgba(64,141,255,0.3)",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span className="anim-goal-flash" style={{ fontSize: 20 }}>
              💡
            </span>
            <div>
              <div style={{ color: "var(--texto)", fontWeight: 700, fontSize: 13 }}>Predicciones gratuitas</div>
              <div style={{ color: "var(--texto-ter)", fontSize: 12 }}>Si aciertas ganas +1 ⚽. Marcador exacto: +3 ⚽</div>
              <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 4, opacity: 0.85 }}>💡 Puedes editar tu predicción hasta 5 minutos antes del inicio del partido.</div>
            </div>
          </div>

          {fechasDisponibles.length > 0 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
              <button
                onClick={() => setFechaSeleccionada("")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: !fechaSeleccionada ? "2px solid #FD7751" : bordeSuave,
                  background: !fechaSeleccionada ? "rgba(253,119,81,0.2)" : fondoSuave,
                  color: !fechaSeleccionada ? "#FD7751" : textoSuaveFuerte,
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Próximos
              </button>
              {fechasDisponibles.map((f) => (
                <button
                  key={f}
                  onClick={() => setFechaSeleccionada(f)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: fechaSeleccionada === f ? "2px solid #FD7751" : bordeSuave,
                    background: fechaSeleccionada === f ? "rgba(253,119,81,0.2)" : fondoSuave,
                    color: fechaSeleccionada === f ? "#FD7751" : textoSuaveFuerte,
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatearFecha(f)}
                </button>
              ))}
            </div>
          )}

          {partidosFiltrados.length === 0 ? (
            <div style={{ color: "var(--texto-ter)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              {partidos.length === 0
                ? "Cargando partidos..."
                : partidos.filter((p) => p.estado === "pendiente" && !idsPredichos.has(p.id)).length > 0
                ? "No hay partidos con predicción abierta en esta fecha"
                : "Ya predijiste todos los partidos disponibles"}
            </div>
          ) : (
            partidosFiltrados.map((p, idx) => (
              <div
                key={p.id}
                className="anim-slide-up micro-card"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 16,
                  padding: "16px",
                  marginBottom: 14,
                  animationDelay: `${idx * 0.08}s`,
                  animationFillMode: "both",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                    {p.grupo ? `Grupo ${p.grupo}` : (p.fase || "Partido")}
                  </span>
                  <span style={{ color: "var(--texto-ter)", fontSize: 12 }}>
                    📅 {formatearFecha(p.fecha)} · {p.hora}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ textAlign: "center" }}>
                    <Bandera codigo={p.bandera_l} nombre={p.local} size={36} />
                    <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 14, marginTop: 6 }}>{p.local}</div>
                  </div>
                  <div className="anim-stadium-glow" style={{ background: "var(--card)", borderRadius: 10, padding: "10px 16px" }}>
                    <div style={{ color: "var(--texto-ter)", fontSize: 13, fontWeight: 700 }}>VS</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Bandera codigo={p.bandera_v} nombre={p.visitante} size={36} />
                    <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 14, marginTop: 6 }}>{p.visitante}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "var(--texto-sec)", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>¿Quién gana?</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { val: "local", label: p.local, codigo: p.bandera_l },
                      { val: "empate", label: "Empate", codigo: null },
                      { val: "visitante", label: p.visitante, codigo: p.bandera_v },
                    ].map((op) => {
                      const activa = preds[p.id]?.resultado === op.val;
                      return (
                        <button
                          key={op.val}
                          onClick={() => set(p.id, "resultado", op.val)}
                          style={{
                            padding: "10px 6px",
                            borderRadius: 10,
                            cursor: "pointer",
                            border: activa ? "2px solid #FD7751" : bordeSuave,
                            background: activa ? "rgba(253,119,81,0.2)" : fondoSuave,
                            color: activa ? "#FD7751" : textoSuave,
                            fontWeight: activa ? 800 : 600,
                            fontSize: 12,
                            textAlign: "center",
                          }}
                        >
                          <div style={{ marginBottom: 3, display: "flex", justifyContent: "center" }}>
                            {op.codigo ? <Bandera codigo={op.codigo} nombre={op.label} size={24} /> : <span style={{ fontSize: 18 }}>🤝</span>}
                          </div>
                          {op.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: "var(--texto-sec)", fontSize: 12, marginBottom: 6, fontWeight: 700 }}>Marcador exacto opcional (+3 ⚽)</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      value={preds[p.id]?.gl || ""}
                      onChange={(e) => set(p.id, "gl", e.target.value)}
                      style={{ width: 56, padding: "8px", textAlign: "center", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, color: "var(--texto)", fontSize: 16, outline: "none" }}
                    />
                    <span style={{ color: "var(--texto-ter)", fontSize: 18, fontWeight: 700 }}>-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      value={preds[p.id]?.gv || ""}
                      onChange={(e) => set(p.id, "gv", e.target.value)}
                      style={{ width: 56, padding: "8px", textAlign: "center", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, color: "var(--texto)", fontSize: 16, outline: "none" }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => confirmar(p)}
                  disabled={enviando[p.id]}
                  className={!enviando[p.id] ? "anim-stadium-glow" : ""}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: enviando[p.id] ? "rgba(253,119,81,0.5)" : "linear-gradient(135deg, #FD7751, #e5622a)",
                    border: "none",
                    borderRadius: 12,
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: enviando[p.id] ? "not-allowed" : "pointer",
                  }}
                >
                  {enviando[p.id] ? "Guardando..." : "⚽ Confirmar predicción"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {verTab === "mis" && (
        <div>
          {misPredicciones.length === 0 ? (
            <div style={{ color: "var(--texto-ter)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              Aún no has hecho predicciones. Empieza ahora.
            </div>
          ) : (
            misPredicciones.map((pred, idx) => {
              const partido = pred.partido || {};
              const info = getEstadoLabel(pred.estado);

              return (
                <div
                  key={pred.id}
                  className={`anim-slide-up micro-card ${info.anim}`}
                  style={{
                    background: info.bg,
                    border: `1px solid ${info.color}30`,
                    borderRadius: 14,
                    padding: "14px 16px",
                    marginBottom: 10,
                    animationDelay: `${idx * 0.06}s`,
                    animationFillMode: "both",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: "var(--texto-ter)", fontSize: 11 }}>
                      {partido.grupo ? `Grupo ${partido.grupo}` : (partido.fase || "Partido")} · {formatearFecha(partido.fecha)}
                    </span>
                    {pred.goles_ganados > 0 && (
                      <span className="anim-goal-flash" style={{ color: C.verde, fontWeight: 900, fontSize: 14 }}>
                        +{pred.goles_ganados} ⚽
                      </span>
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
                    <div style={{ fontSize: 12, color: "var(--texto-sec)" }}>
                      Tu predicción:{" "}
                      <span style={{ color: "var(--texto)", fontWeight: 700 }}>
                        {pred.resultado === "local" ? partido.local_equipo : pred.resultado === "visitante" ? partido.visitante_equipo : "Empate"}
                      </span>
                      <span style={{ color: "var(--texto-ter)" }}> ({pred.goles_local}-{pred.goles_visitante})</span>
                    </div>
                  </div>

                  {pred.estado !== "pendiente" && (
                    <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: `${info.color}15` }}>
                      <div style={{ color: "var(--texto-sec)", fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                        Resultado real: {partido.goles_local} - {partido.goles_visitante}
                      </div>
                      {pred.estado === "fallida" ? (
                        <div>
                          <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 4 }}>{getMensajePositivo(idx)}</div>
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
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ color: "var(--texto-ter)", fontSize: 11 }}>⏳ Esperando resultado del partido</div>
                      {esBloqueado(partido) ? (
                        <span style={{ color: "var(--texto-ter)", fontSize: 11 }}>🔒 Cerrada</span>
                      ) : (
                        <button
                          onClick={() => abrirEdicion(pred)}
                          style={{
                            background: "rgba(64,141,255,0.15)",
                            border: "1px solid rgba(64,141,255,0.4)",
                            color: "#408DFF",
                            borderRadius: 8,
                            padding: "5px 12px",
                            fontWeight: 700,
                            fontSize: 11,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ✏️ Editar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {editando && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => !guardandoEdicion && setEditando(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card)",
              borderRadius: 18,
              padding: 22,
              maxWidth: 420,
              width: "100%",
              border: "1px solid var(--card-border)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 17 }}>✏️ Editar predicción</div>
              <button
                onClick={() => !guardandoEdicion && setEditando(null)}
                disabled={guardandoEdicion}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "var(--texto-ter)", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <Bandera codigo={editando.partido?.bandera_local} nombre={editando.partido?.local_equipo} size={32} />
                <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 13, marginTop: 4 }}>{editando.partido?.local_equipo}</div>
              </div>
              <div style={{ background: "var(--input-bg)", borderRadius: 8, padding: "8px 14px", color: "var(--texto-ter)", fontWeight: 700, fontSize: 12 }}>VS</div>
              <div style={{ textAlign: "center" }}>
                <Bandera codigo={editando.partido?.bandera_visitante} nombre={editando.partido?.visitante_equipo} size={32} />
                <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 13, marginTop: 4 }}>{editando.partido?.visitante_equipo}</div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "var(--texto-sec)", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>¿Quién gana?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[
                  { val: "local", label: editando.partido?.local_equipo, codigo: editando.partido?.bandera_local },
                  { val: "empate", label: "Empate", codigo: null },
                  { val: "visitante", label: editando.partido?.visitante_equipo, codigo: editando.partido?.bandera_visitante },
                ].map((op) => {
                  const activa = editando.resultado === op.val;
                  return (
                    <button
                      key={op.val}
                      onClick={() => setEditando((e) => ({ ...e, resultado: op.val }))}
                      style={{
                        padding: "9px 4px",
                        borderRadius: 9,
                        cursor: "pointer",
                        border: activa ? "2px solid #FD7751" : bordeSuave,
                        background: activa ? "rgba(253,119,81,0.2)" : fondoSuave,
                        color: activa ? "#FD7751" : textoSuave,
                        fontWeight: activa ? 800 : 600,
                        fontSize: 11,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ marginBottom: 3, display: "flex", justifyContent: "center" }}>
                        {op.codigo ? <Bandera codigo={op.codigo} nombre={op.label} size={20} /> : <span style={{ fontSize: 16 }}>🤝</span>}
                      </div>
                      {op.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ color: "var(--texto-sec)", fontSize: 12, marginBottom: 6, fontWeight: 700 }}>Marcador exacto opcional (+3 ⚽)</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={editando.gl}
                  onChange={(e) => setEditando((s) => ({ ...s, gl: e.target.value }))}
                  style={{ width: 56, padding: "8px", textAlign: "center", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, color: "var(--texto)", fontSize: 16 }}
                />
                <span style={{ color: "var(--texto-ter)", fontSize: 18, fontWeight: 700 }}>-</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={editando.gv}
                  onChange={(e) => setEditando((s) => ({ ...s, gv: e.target.value }))}
                  style={{ width: 56, padding: "8px", textAlign: "center", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, color: "var(--texto)", fontSize: 16 }}
                />
              </div>
            </div>

            <div style={{ background: "rgba(236,168,45,0.1)", border: "1px solid rgba(236,168,45,0.3)", borderRadius: 10, padding: "10px 12px", marginBottom: 14, color: "#ECA82D", fontSize: 11, lineHeight: 1.4 }}>
              ⏰ Recuerda: las predicciones se cierran 5 minutos antes del inicio del partido.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setEditando(null)}
                disabled={guardandoEdicion}
                style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid var(--input-border)", background: "none", color: "var(--texto-sec)", fontWeight: 700, fontSize: 13, cursor: guardandoEdicion ? "not-allowed" : "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardandoEdicion}
                style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: guardandoEdicion ? "rgba(253,119,81,0.5)" : "linear-gradient(135deg, #FD7751, #e5622a)", color: "#FFFFFF", fontWeight: 800, fontSize: 13, cursor: guardandoEdicion ? "not-allowed" : "pointer" }}
              >
                {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
