import { useState, useEffect } from "react";
import client from "../../api/client";
import { C } from "./constants";

export default function Misiones({ usuario, cargarPerfil }) {
  const [misiones, setMisiones] = useState([]);
  const [completadas, setCompletadas] = useState(0);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [reclamando, setReclamando] = useState(null);
  const [mostrarCompartir, setMostrarCompartir] = useState(false);
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const [tiempoVideo, setTiempoVideo] = useState(0);
  const [videoVisto, setVideoVisto] = useState(false);
  const [mostrarTrivia, setMostrarTrivia] = useState(false);
  const [triviaActual, setTriviaActual] = useState(0);
  const [triviaRespuestas, setTriviaRespuestas] = useState([]);
  const [triviaSeleccion, setTriviaSeleccion] = useState(null);
  const [triviaResultado, setTriviaResultado] = useState(null);

  const VIDEO_URL = "https://youtu.be/QtKq3ugMouI?si=g45EzWN9S3b4em3G";
  const SEGUNDOS_MINIMO = 30;

  const PREGUNTAS_TRIVIA = [
    { pregunta: "¿En que pais se jugara la final del Mundial 2026?", opciones: ["Mexico", "Estados Unidos", "Canada", "Brasil"], correcta: 1 },
    { pregunta: "¿Que seleccion ha ganado mas Mundiales?", opciones: ["Alemania", "Argentina", "Italia", "Brasil"], correcta: 3 },
    { pregunta: "¿Cuantos equipos participaran en el Mundial 2026?", opciones: ["32", "36", "48", "64"], correcta: 2 },
    { pregunta: "¿Quien gano el Mundial 2022 en Qatar?", opciones: ["Francia", "Argentina", "Brasil", "Croacia"], correcta: 1 },
    { pregunta: "¿En que año se celebro el primer Mundial de futbol?", opciones: ["1928", "1930", "1934", "1950"], correcta: 1 },
  ];

  const codigoReferido = usuario?.uid?.substring(0, 8).toUpperCase() || "";
  const urlInvitacion = `${window.location.origin}?ref=${codigoReferido}`;
  const mensajeInvitacion = `Unete a CLTiene Mundial 2026! Predice partidos, acumula monedas y gana premios. Registrate aqui: ${urlInvitacion}`;

  const cargarMisiones = async (uid) => {
    try {
      const res = await client.get(`/misiones/${uid}`);
      setMisiones(res.data.misiones);
      setCompletadas(res.data.completadas);
      setTotal(res.data.total);
      // Si el backend otorgó goles automáticamente, refrescar perfil
      if (res.data.goles_otorgados > 0) {
        await cargarPerfil();
      }
    } catch {
      console.error("Error cargando misiones");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuario?.uid) cargarMisiones(usuario.uid);
  }, [usuario?.uid]);

  // Timer del video: cuenta regresiva mientras el modal está abierto
  useEffect(() => {
    if (!mostrarVideo || videoVisto) return;
    const interval = setInterval(() => {
      setTiempoVideo((t) => {
        if (t + 1 >= SEGUNDOS_MINIMO) {
          setVideoVisto(true);
          clearInterval(interval);
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mostrarVideo, videoVisto]);

  const reclamar = async (misionId) => {
    if (misionId === "invita_amigo") {
      setMostrarCompartir(true);
      return;
    }
    if (misionId === "ver_video") {
      setMostrarVideo(true);
      setTiempoVideo(0);
      setVideoVisto(false);
      return;
    }
    if (misionId === "trivia_mundial") {
      setMostrarTrivia(true);
      setTriviaActual(0);
      setTriviaRespuestas([]);
      setTriviaSeleccion(null);
      setTriviaResultado(null);
      return;
    }
    setReclamando(misionId);
    try {
      const res = await client.post(`/misiones/${usuario.uid}/${misionId}/completar`);
      alert(res.data.mensaje);
      await cargarMisiones(usuario.uid);
      await cargarPerfil();
    } catch (err) {
      const msg = err.response?.data?.message || "No se pudo completar la misión";
      alert(msg);
    } finally {
      setReclamando(null);
    }
  };

  const reclamarVideo = async () => {
    setMostrarVideo(false);
    setReclamando("ver_video");
    try {
      const res = await client.post(`/misiones/${usuario.uid}/ver_video/completar`);
      alert(res.data.mensaje);
      await cargarMisiones(usuario.uid);
      await cargarPerfil();
    } catch (err) {
      const msg = err.response?.data?.message || "No se pudo completar la misión";
      alert(msg);
    } finally {
      setReclamando(null);
    }
  };

  const responderTrivia = (indiceOpcion) => {
    setTriviaSeleccion(indiceOpcion);
    const esCorrecta = indiceOpcion === PREGUNTAS_TRIVIA[triviaActual].correcta;
    const nuevasRespuestas = [...triviaRespuestas, esCorrecta];
    setTriviaRespuestas(nuevasRespuestas);

    setTimeout(() => {
      setTriviaSeleccion(null);
      if (triviaActual + 1 < PREGUNTAS_TRIVIA.length) {
        setTriviaActual(triviaActual + 1);
      } else {
        const correctas = nuevasRespuestas.filter(Boolean).length;
        const golesGanados = Math.max(1, correctas);
        setTriviaResultado({ correctas, total: PREGUNTAS_TRIVIA.length, goles: golesGanados });
      }
    }, 1000);
  };

  const reclamarTrivia = async () => {
    const correctas = triviaResultado?.correctas || 0;
    setMostrarTrivia(false);
    setReclamando("trivia_mundial");
    try {
      const res = await client.post(`/misiones/${usuario.uid}/trivia`, { correctas });
      alert(res.data.mensaje);
      await cargarMisiones(usuario.uid);
      await cargarPerfil();
    } catch (err) {
      const msg = err.response?.data?.message || "No se pudo completar la trivia";
      alert(msg);
    } finally {
      setReclamando(null);
    }
  };

  const compartir = (red) => {
    const texto = encodeURIComponent(mensajeInvitacion);
    const url = encodeURIComponent(urlInvitacion);

    const enlaces = {
      whatsapp: `https://wa.me/?text=${texto}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(mensajeInvitacion)}`,
      instagram: `https://www.instagram.com/`,
    };

    window.open(enlaces[red], "_blank");
    setMostrarCompartir(false);
  };

  if (cargando) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--texto-sec)" }}>
        Cargando misiones...
      </div>
    );
  }

  const redesSociales = [
    { id: "whatsapp",  icono: "💬", nombre: "WhatsApp",  color: "#25D366" },
    { id: "facebook",  icono: "📘", nombre: "Facebook",  color: "#1877F2" },
    { id: "instagram", icono: "📷", nombre: "Instagram", color: "#E4405F" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ color: "var(--texto)", fontWeight: 800, fontSize: 16 }}>Tus misiones</span>
        <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{completadas} / {total} completadas</span>
      </div>
      <div style={{ background: "rgba(22,199,132,0.1)", border: "1px solid rgba(22,199,132,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚽</span>
        <div>
          <div style={{ color: "var(--texto)", fontWeight: 700, fontSize: 13 }}>Gana goles completando misiones</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 12 }}>Los goles se acumulan aparte de las monedas</div>
        </div>
      </div>
      {misiones.map((m, idx) => (
        <div key={m.id} className="anim-slide-up" style={{ display: "flex", alignItems: "center", gap: 14, background: m.ok ? "rgba(22,199,132,0.08)" : "rgba(255,255,255,0.04)", border: m.ok ? "1px solid rgba(22,199,132,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, opacity: m.ok ? 0.8 : 1, animationDelay: `${idx * 0.08}s`, animationFillMode: "both" }}>
          <div className={m.ok ? "anim-confetti" : ""} style={{ width: 44, height: 44, borderRadius: 12, background: m.ok ? "rgba(22,199,132,0.15)" : "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {m.icono}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: m.ok ? "#16C784" : "#fff", fontWeight: 700, fontSize: 14 }}>{m.titulo}</div>
            <div style={{ color: "var(--texto-ter)", fontSize: 12, marginTop: 2 }}>{m.desc}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: C.verde, fontWeight: 900, fontSize: 14 }}>+{m.goles} ⚽</div>
            {m.ok
              ? <div style={{ color: "#16C784", fontSize: 11, marginTop: 3 }}>✓ Listo</div>
              : <button
                  onClick={() => reclamar(m.id)}
                  disabled={reclamando === m.id}
                  style={{ marginTop: 4, background: reclamando === m.id ? "#666" : "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 8, color: "var(--texto)", fontWeight: 700, fontSize: 12, padding: "5px 12px", cursor: reclamando === m.id ? "wait" : "pointer" }}
                >
                  {reclamando === m.id ? "..." : m.id === "invita_amigo" ? "Compartir →" : m.id === "ver_video" ? "Ver video →" : m.id === "trivia_mundial" ? "Jugar trivia →" : "Reclamar →"}
                </button>
            }
          </div>
        </div>
      ))}

      {/* Modal compartir redes sociales */}
      {mostrarCompartir && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={() => setMostrarCompartir(false)}>
          <div style={{ background: "#1a1130", borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "90%", border: "1px solid rgba(253,119,81,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
              <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 18 }}>Invita a un amigo</div>
              <div style={{ color: "var(--texto-sec)", fontSize: 13, marginTop: 6 }}>Cuando alguien se registre con tu enlace, ganas +5 ⚽</div>
            </div>
            <div style={{ background: "rgba(236,168,45,0.15)", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ color: "var(--texto-sec)", fontSize: 11, marginBottom: 4 }}>Tu codigo de referido</div>
              <div style={{ color: "#ECA82D", fontWeight: 900, fontSize: 20, letterSpacing: 2 }}>{codigoReferido}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {redesSociales.map((red) => (
                <button
                  key={red.id}
                  onClick={() => compartir(red.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, background: `${red.color}20`, border: `1px solid ${red.color}50`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", width: "100%" }}
                >
                  <span style={{ fontSize: 24 }}>{red.icono}</span>
                  <span style={{ color: red.color, fontWeight: 700, fontSize: 15 }}>{red.nombre}</span>
                  <span style={{ marginLeft: "auto", color: "var(--texto-ter)", fontSize: 18 }}>→</span>
                </button>
              ))}
            </div>
            <button onClick={() => setMostrarCompartir(false)} style={{ marginTop: 16, width: "100%", background: "var(--card)", border: "1px solid var(--input-border)", borderRadius: 10, padding: "10px", color: "var(--texto-sec)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal video */}
      {mostrarVideo && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1a1130", borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "95%", border: "1px solid rgba(253,119,81,0.3)" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>▶️</div>
              <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 17 }}>Video CLTiene</div>
              <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 4 }}>
                Mira el video completo para ganar +3 ⚽
              </div>
            </div>

            <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, aspectRatio: "16/9", background: "#000" }}>
              <iframe
                src={`${VIDEO_URL}?autoplay=1&rel=0`}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Video CLTiene"
              />
            </div>

            {!videoVisto ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ background: "var(--card)", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
                  <div style={{ color: "var(--texto-ter)", fontSize: 11, marginBottom: 4 }}>Podras reclamar en</div>
                  <div style={{ color: C.naranja, fontWeight: 900, fontSize: 24 }}>
                    {SEGUNDOS_MINIMO - tiempoVideo}s
                  </div>
                  <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(tiempoVideo / SEGUNDOS_MINIMO) * 100}%`, background: `linear-gradient(90deg, ${C.naranja}, ${C.dorado})`, borderRadius: 2, transition: "width 1s linear" }} />
                  </div>
                </div>
                <button onClick={() => setMostrarVideo(false)} style={{ width: "100%", background: "var(--card)", border: "1px solid var(--input-border)", borderRadius: 10, padding: "10px", color: "var(--texto-sec)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cerrar
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ background: "rgba(22,199,132,0.1)", border: "1px solid rgba(22,199,132,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#16C784", fontSize: 13, fontWeight: 700 }}>
                  ✓ Video completado
                </div>
                <button
                  onClick={reclamarVideo}
                  style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 12, color: "var(--texto)", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(253,119,81,0.4)" }}
                >
                  Reclamar +3 ⚽
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal trivia del mundial */}
      {mostrarTrivia && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1a1130", borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "95%", border: "1px solid rgba(130,43,210,0.4)" }}>

            {/* Mientras responde preguntas */}
            {!triviaResultado && (
              <div>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🧠</div>
                  <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 17 }}>Trivia del Mundial</div>
                  <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 4 }}>
                    Pregunta {triviaActual + 1} de {PREGUNTAS_TRIVIA.length} — ¡Cada acierto suma goles!
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {PREGUNTAS_TRIVIA.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < triviaRespuestas.length ? (triviaRespuestas[i] ? "#16C784" : "#ED1E28") : i === triviaActual ? "rgba(253,119,81,0.5)" : "rgba(255,255,255,0.1)" }} />
                  ))}
                </div>

                {/* Pregunta */}
                <div style={{ background: "var(--card)", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
                  <div style={{ color: "var(--texto)", fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>
                    {PREGUNTAS_TRIVIA[triviaActual].pregunta}
                  </div>
                </div>

                {/* Opciones */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PREGUNTAS_TRIVIA[triviaActual].opciones.map((op, i) => {
                    const yaRespondio = triviaSeleccion !== null;
                    const esSeleccionada = triviaSeleccion === i;
                    const esCorrecta = i === PREGUNTAS_TRIVIA[triviaActual].correcta;
                    let bg = "rgba(255,255,255,0.05)";
                    let border = "1px solid rgba(255,255,255,0.1)";
                    let color = "#fff";
                    if (yaRespondio && esSeleccionada && esCorrecta) { bg = "rgba(22,199,132,0.15)"; border = "1px solid #16C784"; color = "#16C784"; }
                    if (yaRespondio && esSeleccionada && !esCorrecta) { bg = "rgba(237,30,40,0.15)"; border = "1px solid #ED1E28"; color = "#ED1E28"; }
                    if (yaRespondio && !esSeleccionada && esCorrecta) { bg = "rgba(22,199,132,0.1)"; border = "1px solid rgba(22,199,132,0.3)"; color = "#16C784"; }

                    return (
                      <button
                        key={i}
                        onClick={() => !yaRespondio && responderTrivia(i)}
                        disabled={yaRespondio}
                        style={{ display: "flex", alignItems: "center", gap: 12, background: bg, border, borderRadius: 12, padding: "13px 16px", cursor: yaRespondio ? "default" : "pointer", width: "100%", transition: "all 0.2s" }}
                      >
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--texto-sec)", flexShrink: 0 }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ color, fontWeight: 600, fontSize: 14, textAlign: "left" }}>{op}</span>
                        {yaRespondio && esSeleccionada && esCorrecta && <span style={{ marginLeft: "auto", fontSize: 16 }}>✓</span>}
                        {yaRespondio && esSeleccionada && !esCorrecta && <span style={{ marginLeft: "auto", fontSize: 16 }}>✗</span>}
                      </button>
                    );
                  })}
                </div>

                <button onClick={() => setMostrarTrivia(false)} style={{ marginTop: 14, width: "100%", background: "var(--card)", border: "1px solid var(--input-border)", borderRadius: 10, padding: "10px", color: "var(--texto-sec)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            )}

            {/* Resultado final - siempre gana */}
            {triviaResultado && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {triviaResultado.correctas >= 4 ? "🏆" : triviaResultado.correctas >= 2 ? "🎉" : "⚽"}
                </div>
                <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 20, marginBottom: 6 }}>
                  {triviaResultado.correctas === 5 ? "¡Perfecto!" : triviaResultado.correctas >= 3 ? "¡Muy bien!" : "¡Buen intento!"}
                </div>
                <div style={{ color: "var(--texto-sec)", fontSize: 14, marginBottom: 8 }}>
                  Acertaste {triviaResultado.correctas} de {triviaResultado.total} preguntas
                </div>
                <div style={{ color: C.verde, fontWeight: 900, fontSize: 22, marginBottom: 16 }}>
                  +{triviaResultado.goles} ⚽ ganados
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
                  {triviaRespuestas.map((ok, i) => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: ok ? "rgba(22,199,132,0.15)" : "rgba(237,30,40,0.15)", border: ok ? "1px solid #16C784" : "1px solid #ED1E28", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      {ok ? "✓" : "✗"}
                    </div>
                  ))}
                </div>

                <button
                  onClick={reclamarTrivia}
                  style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 12, color: "var(--texto)", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(253,119,81,0.4)" }}
                >
                  Reclamar +{triviaResultado.goles} ⚽
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
