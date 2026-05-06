import { useState, useEffect } from "react";
import client from "../../api/client";
import { C } from "./constants";
import { getNombreMarca, getVideoDelDia } from "../../utils/marca";
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
  const [videoReproduciendo, setVideoReproduciendo] = useState(false);
  const [mostrarRunner, setMostrarRunner] = useState(false);
  const [runnerJugadoHoy, setRunnerJugadoHoy] = useState(false);
  const [mostrarTrivia, setMostrarTrivia] = useState(false);
  const [triviaActual, setTriviaActual] = useState(0);
  const [triviaRespuestas, setTriviaRespuestas] = useState([]);
  const [triviaSeleccion, setTriviaSeleccion] = useState(null);
  const [triviaResultado, setTriviaResultado] = useState(null);
  const [PREGUNTAS_TRIVIA, setPREGUNTAS_TRIVIA] = useState([]);

  // Video del día (rota entre los videos configurados por la empresa)
  const VIDEO_URL = getVideoDelDia();
  const SEGUNDOS_MINIMO = 20;
  const MONEDAS_VIDEO = 20;
  const [segundosObjetivo, setSegundosObjetivo] = useState(SEGUNDOS_MINIMO);
  const [videoDisponible, setVideoDisponible] = useState(true);

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
      const videoDispBackend = res.data.video_disponible ?? true;
      setVideoDisponible(videoDispBackend);
      const misionesAjustadas = res.data.misiones
        // Oculta temporalmente la mision "invitar amigo" (codigo conservado para reactivar luego)
        .filter((m) => m.id !== "invita_amigo")
        // Oculta "ver_video" si la marca no configuró videos
        .filter((m) => m.id !== "ver_video" || !!VIDEO_URL)
        .map((m) => {
          if (m.id === "trivia_mundial" && disponible && m.ok) {
            return { ...m, ok: false, desc: "Trivia diaria disponible! Juega hoy." };
          }
          if (m.id === "runner_mascotas") {
            return {
              ...m,
              ok: !runnerDisponible,
              desc: runnerDisponible
                ? "Juega el runner y completa la mision"
                : "Ya jugaste hoy. Puedes jugar de nuevo sin ganar mas monedas.",
              botonLabel: runnerDisponible ? "Jugar ->" : undefined,
              botonOkLabel: runnerDisponible ? undefined : "Jugar de nuevo",
            };
          }
          if (m.id === "runner_mascotas_legacy") {
            return { ...m, ok: false, botonLabel: runnerDisponible ? "Reclamar →" : "Jugar de nuevo" };
          }
          if (m.id === "ver_video") {
            return {
              ...m,
              ok: !videoDispBackend,
              desc: videoDispBackend
                ? "Video del día disponible. ¡Mira el de hoy!"
                : "Ya viste el video de hoy. Vuelve mañana.",
              botonLabel: videoDispBackend ? "Ver video →" : "Ver de nuevo",
            };
          }
          return m;
        });
      setMisiones(misionesAjustadas);
      // Recalcular total y completadas desde la lista filtrada (en vez del backend)
      setCompletadas(misionesAjustadas.filter((m) => m.ok).length);
      setTotal(misionesAjustadas.length);
      setTriviaDisponible(res.data.trivia_disponible ?? false);
      if (res.data.monedas_otorgadas > 0) {
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
    if (!mostrarVideo || videoVisto || !videoReproduciendo) return;
    const interval = setInterval(() => {
      setTiempoVideo((t) => {
        if (t + 1 >= segundosObjetivo) {
          setVideoVisto(true);
          setVideoReproduciendo(false);
          clearInterval(interval);
          return segundosObjetivo;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mostrarVideo, videoVisto, videoReproduciendo, segundosObjetivo]);

  const reclamar = async (misionId) => {
    if (misionId === "runner_mascotas") return setMostrarRunner(true);
    if (misionId === "invita_amigo") return setMostrarCompartir(true);
    if (misionId === "ver_video") {
      if (!videoDisponible) {
        alert("Ya viste el video de hoy. Vuelve mañana para ganar más monedas.");
        return;
      }
      setSegundosObjetivo(SEGUNDOS_MINIMO);
      setMostrarVideo(true);
      setTiempoVideo(0);
      setVideoVisto(false);
      setVideoReproduciendo(false);
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
    if (!videoVisto || tiempoVideo < segundosObjetivo) {
      alert("Debes ver el video el tiempo requerido antes de reclamar las monedas.");
      return;
    }

    setMostrarVideo(false);
    setReclamando("ver_video");
    try {
      const res = await client.post(`/misiones/${usuario.uid}/video`);
      alert(res.data.mensaje);
      await cargarMisiones(usuario.uid);
      if (!res.data.ya_visto) await cargarPerfil();
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
        // Cada acierto = 5 monedas, mínimo 5 monedas (debe coincidir con backend)
        const monedasGanadas = Math.max(5, correctas * 5);
        setTriviaResultado({ correctas, total: PREGUNTAS_TRIVIA.length, monedas: monedasGanadas });
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
  const monedasVideo = misiones.find((m) => m.id === "ver_video")?.monedas || MONEDAS_VIDEO;

  return (
    <div style={{ background: "linear-gradient(135deg, rgba(130,43,210,0.05) 0%, rgba(253,119,81,0.05) 100%)", borderRadius: 16, padding: "20px 0", minHeight: "60vh" }}>
      <div style={{ paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 24, marginBottom: 4 }}>🎯 Tus Misiones</div>
            <div style={{ color: "var(--texto-sec)", fontSize: 13 }}>Completa retos y gana 🪙 monedas</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #FD7751, #FF9066)", color: "#FFFFFF", fontSize: 11, fontWeight: 900, padding: "8px 14px", borderRadius: 50, boxShadow: "0 4px 12px rgba(253,119,81,0.3)", textAlign: "center" }}>
            <div>{completadas}/{total}</div>
            <div style={{ fontSize: 9, opacity: 0.9 }}>COMPLETADAS</div>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.15) 0%, rgba(236,168,45,0.05) 100%)", border: "2px solid rgba(236,168,45,0.4)", borderRadius: 14, padding: "16px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 16px rgba(236,168,45,0.1)" }}>
          <div style={{ fontSize: 32 }}>🪙</div>
          <div>
            <div style={{ color: "#ECA82D", fontWeight: 800, fontSize: 14 }}>Sistema de Monedas</div>
            <div style={{ color: "rgba(236,168,45,0.9)", fontSize: 12, marginTop: 2 }}>Acumula monedas completando retos y canjéalas por beneficios</div>
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

      {mostrarVideo && (
        <VideoModal
          tiempoVideo={tiempoVideo}
          videoVisto={videoVisto}
          segundosObjetivo={segundosObjetivo}
          MONEDAS_VIDEO={monedasVideo}
          onVideoMetadata={(duration) => {
            if (!duration || Number.isNaN(duration)) return;
            const target = Math.min(Math.ceil(duration), SEGUNDOS_MINIMO);
            setSegundosObjetivo(target > 0 ? target : SEGUNDOS_MINIMO);
          }}
          onReclamarVideo={reclamarVideo}
          onCerrar={() => {
            setVideoReproduciendo(false);
            setMostrarVideo(false);
          }}
          onReproduciendoChange={setVideoReproduciendo}
          VIDEO_URL={VIDEO_URL}
        />
      )}

      {mostrarTrivia && <TriviaModal preguntaSiguiente={preguntaActual} triviaActual={triviaActual} PREGUNTAS_TRIVIA={PREGUNTAS_TRIVIA} triviaSeleccion={triviaSeleccion} triviaResultado={triviaResultado} onResponder={responderTrivia} onReclamarTrivia={reclamarTrivia} onCerrar={() => setMostrarTrivia(false)} />}
    </div>
  );
}
