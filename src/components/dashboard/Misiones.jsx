import { useState, useEffect } from "react";
import client from "../../api/client";
import { C } from "./constants";
import { getNombreMarca } from "../../utils/marca";
import MisionCard from "./MisionCard";
import TriviaModal from "./TriviaModal";
import VideoModal from "./VideoModal";
import CompartirModal from "./CompartirModal";
import RunnerModal from "./RunnerModal";

export default function Misiones({ usuario, cargarPerfil }) {
  const bordeSuave = "1px solid var(--input-border)";
  const fondoSuave = "var(--input-bg)";
  const iconoFondo = "var(--input-bg)";
  const tituloPendiente = "var(--texto)";

  const [misiones, setMisiones] = useState([]);
  const [completadas, setCompletadas] = useState(0);
  const [total, setTotal] = useState(0);
  const [triviaDisponible, setTriviaDisponible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [reclamando, setReclamando] = useState(null);
  const [mostrarCompartir, setMostrarCompartir] = useState(false);
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const [tiempoVideo, setTiempoVideo] = useState(0);
  const [videoVisto, setVideoVisto] = useState(false);
  const [mostrarRunner, setMostrarRunner] = useState(false);
  const [runnerJugadoHoy, setRunnerJugadoHoy] = useState(false);
  const [mostrarTrivia, setMostrarTrivia] = useState(false);
  const [triviaActual, setTriviaActual] = useState(0);
  const [triviaRespuestas, setTriviaRespuestas] = useState([]);
  const [triviaSeleccion, setTriviaSeleccion] = useState(null);
  const [triviaResultado, setTriviaResultado] = useState(null);
  const [PREGUNTAS_TRIVIA, setPREGUNTAS_TRIVIA] = useState([]);

  const VIDEO_URL = "https://youtu.be/QtKq3ugMouI?si=g45EzWN9S3b4em3G";
  const SEGUNDOS_MINIMO = 30;

  const codigoReferido = usuario?.uid?.substring(0, 8).toUpperCase() || "";
  const urlInvitacion = `${window.location.origin}?ref=${codigoReferido}`;
  const empresa = getNombreMarca();
  const mensajeInvitacion = `Unete a ${empresa}! Predice partidos, acumula monedas y gana premios. Registrate aqui: ${urlInvitacion}`;

  // Cargar preguntas de trivia dinámicas
  const cargarPreguntasTrivia = async () => {
    try {
      const res = await client.get(`/misiones/trivia/preguntas?empresa_id=${usuario?.empresa_id || 1}`);
      setPREGUNTAS_TRIVIA(res.data.preguntas);
    } catch (e) {
      console.error("Error cargando preguntas", e);
    }
  };

  const cargarMisiones = async (uid) => {
    try {
      const res = await client.get(`/misiones/${uid}`);
      // Override trivia: si es diaria y esta disponible hoy, marcar como pendiente
      const disponible = res.data.trivia_disponible ?? false;
      const runnerDisponible = res.data.runner_disponible ?? true;
      setRunnerJugadoHoy(!runnerDisponible);
      const misionesAjustadas = res.data.misiones.map((m) => {
        if (m.id === "trivia_mundial" && disponible && m.ok) {
          return { ...m, ok: false, desc: "Trivia diaria disponible! Juega hoy." };
        }
        if (m.id === "runner_mascotas") {
          return { ...m, ok: false, botonLabel: runnerDisponible ? "Reclamar →" : "Jugar de nuevo" };
        }
        return m;
      });
      setMisiones(misionesAjustadas);
      setCompletadas(res.data.completadas);
      setTotal(res.data.total);
      setTriviaDisponible(res.data.trivia_disponible ?? false);
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
    cargarPreguntasTrivia();
    if (usuario?.uid) cargarMisiones(usuario.uid);
  }, [usuario?.uid]);

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
    if (misionId === "runner_mascotas") return setMostrarRunner(true);
    if (misionId === "invita_amigo") return setMostrarCompartir(true);
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
      alert(err.response?.data?.message || "No se pudo completar la mision");
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
      alert(err.response?.data?.message || "No se pudo completar la mision");
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
      alert(err.response?.data?.message || "No se pudo completar la trivia");
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
      instagram: "https://www.instagram.com/",
    };
    window.open(enlaces[red], "_blank");
    setMostrarCompartir(false);
  };

  if (cargando) {
    return <div style={{ textAlign: "center", padding: 40, color: "var(--texto-sec)" }}>Cargando misiones...</div>;
  }

  const redesSociales = [
    { id: "whatsapp", icono: "whatsapp", nombre: "WhatsApp", color: "#25D366" },
    { id: "facebook", icono: "facebook", nombre: "Facebook", color: "#1877F2" },
    { id: "instagram", icono: "instagram", nombre: "Instagram", color: "#E4405F" },
  ];

  const preguntaActual = PREGUNTAS_TRIVIA[triviaActual];

  return (
    <div style={{ background: "linear-gradient(135deg, rgba(130,43,210,0.05) 0%, rgba(253,119,81,0.05) 100%)", borderRadius: 16, padding: "20px 0", minHeight: "60vh" }}>
      <div style={{ paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 24, marginBottom: 4 }}>🎯 Tus Misiones</div>
            <div style={{ color: "var(--texto-sec)", fontSize: 13 }}>Completa retos y gana ⚽ goles</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #FD7751, #FF9066)", color: "#FFFFFF", fontSize: 11, fontWeight: 900, padding: "8px 14px", borderRadius: 50, boxShadow: "0 4px 12px rgba(253,119,81,0.3)", textAlign: "center" }}>
            <div>{completadas}/{total}</div>
            <div style={{ fontSize: 9, opacity: 0.9 }}>COMPLETADAS</div>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(22,199,132,0.15) 0%, rgba(22,199,132,0.05) 100%)", border: "2px solid rgba(22,199,132,0.4)", borderRadius: 14, padding: "16px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 16px rgba(22,199,132,0.1)" }}>
          <div style={{ fontSize: 32 }}>⚽</div>
          <div>
            <div style={{ color: "#16C784", fontWeight: 800, fontSize: 14 }}>Sistema de Goles</div>
            <div style={{ color: "rgba(22,199,132,0.8)", fontSize: 12, marginTop: 2 }}>Acumula goles completando retos sin límite diario</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "var(--texto-sec)", fontSize: 11, fontWeight: 600 }}>PROGRESO</span>
            <span style={{ color: C.naranja, fontWeight: 700, fontSize: 12 }}>{Math.round((completadas / total) * 100)}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ height: "100%", width: `${(completadas / total) * 100}%`, background: "linear-gradient(90deg, #FD7751, #16C784)", borderRadius: 10, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }} />
          </div>
        </div>
      </div>

      {misiones.map((m, idx) => (
        <div key={m.id} className="anim-slide-up" style={{ animationDelay: `${idx * 0.08}s`, animationFillMode: "both" }}>
          <MisionCard mision={m} reclamando={reclamando} onReclamar={reclamar} fondoSuave={fondoSuave} bordeSuave={bordeSuave} iconoFondo={iconoFondo} tituloPendiente={tituloPendiente} />
        </div>
      ))}

      {mostrarRunner && (
        <RunnerModal
          onCerrar={() => setMostrarRunner(false)}
          onCompletar={async () => {
            setMostrarRunner(false);
            setReclamando("runner_mascotas");
            try {
              const res = await client.post(`/misiones/${usuario.uid}/runner`);
              alert(res.data.mensaje);
              await cargarMisiones(usuario.uid);
              if (!res.data.ya_jugado) await cargarPerfil();
            } catch (err) {
              alert(err.response?.data?.message || "No se pudo completar la misión");
            } finally {
              setReclamando(null);
            }
          }}
        />
      )}

      {mostrarCompartir && <CompartirModal onCompartir={compartir} onCerrar={() => setMostrarCompartir(false)} redesSociales={redesSociales} />}

      {mostrarVideo && <VideoModal tiempoVideo={tiempoVideo} videoVisto={videoVisto} SEGUNDOS_MINIMO={SEGUNDOS_MINIMO} onReclamarVideo={reclamarVideo} onCerrar={() => setMostrarVideo(false)} VIDEO_URL={VIDEO_URL} />}

      {mostrarTrivia && <TriviaModal preguntaSiguiente={preguntaActual} triviaActual={triviaActual} PREGUNTAS_TRIVIA={PREGUNTAS_TRIVIA} triviaSeleccion={triviaSeleccion} triviaResultado={triviaResultado} onResponder={responderTrivia} onReclamarTrivia={reclamarTrivia} onCerrar={() => setMostrarTrivia(false)} />}
    </div>
  );
}
