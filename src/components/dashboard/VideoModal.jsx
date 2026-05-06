import { useEffect, useRef } from "react";
import { C } from "./constants";
import { getNombreMarca } from "../../utils/marca";

export default function VideoModal({
  tiempoVideo,
  videoVisto,
  segundosObjetivo,
  MONEDAS_VIDEO = 20,
  onVideoMetadata,
  onReclamarVideo,
  onCerrar,
  onReproduciendoChange,
  VIDEO_URL,
}) {
  const empresa = getNombreMarca();
  const videoRef = useRef(null);
  const segundosRestantes = Math.max(segundosObjetivo - tiempoVideo, 0);
  const progreso = Math.min((tiempoVideo / segundosObjetivo) * 100, 100);

  useEffect(() => {
    if (!videoVisto) return;
    videoRef.current?.pause();
    onReproduciendoChange?.(false);
  }, [videoVisto, onReproduciendoChange]);

  const cerrar = () => {
    onReproduciendoChange?.(false);
    onCerrar();
  };

  const manejarFinVideo = () => {
    if (videoVisto) {
      onReproduciendoChange?.(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.duration > 0 && video.duration <= segundosObjetivo) {
      // Short video: no need to loop if the objective is the same or longer than the clip.
      return;
    }

    if (tiempoVideo >= segundosObjetivo) {
      return;
    }

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => onReproduciendoChange?.(false));
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "linear-gradient(135deg, var(--card) 0%, rgba(var(--card-rgb, 26, 17, 48), 0.95) 100%)", borderRadius: 20, padding: 24, maxWidth: 500, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 18 }}>▶️ Video {empresa}</div>
            <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 2 }}>Gana +{MONEDAS_VIDEO} monedas viendo el video</div>
          </div>
          <button onClick={cerrar} style={{ background: "rgba(255,255,255,0.1)", border: "none", fontSize: 20, cursor: "pointer", color: "var(--texto-ter)", width: 32, height: 32, borderRadius: 8, transition: "all 0.2s" }} onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.15)" }} onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.1)" }}>
            ×
          </button>
        </div>

        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginBottom: 18, boxShadow: "0 10px 40px rgba(0,0,0,0.3)", background: "#000" }}>
          <video
            ref={videoRef}
            key={VIDEO_URL}
            src={VIDEO_URL}
            controls
            autoPlay
            playsInline
            width="100%"
            style={{ display: "block", maxHeight: 320, background: "#000" }}
            title={`Video ${empresa}`}
            onLoadedMetadata={() => {
              const video = videoRef.current;
              if (!video) return;
              onVideoMetadata?.(video.duration);
            }}
            onPlay={() => onReproduciendoChange?.(true)}
            onPause={() => onReproduciendoChange?.(false)}
            onEnded={manejarFinVideo}
          />
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(253,119,81,0.15) 0%, rgba(253,119,81,0.05) 100%)", border: "1.5px solid rgba(253,119,81,0.3)", borderRadius: 14, padding: 16, marginBottom: 18, textAlign: "center" }}>
          <div style={{ color: "var(--texto-sec)", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>TIEMPO RESTANTE</div>
          <div style={{ color: C.naranja, fontWeight: 900, fontSize: 32, lineHeight: 1 }}>
            {segundosRestantes}
          </div>
          <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 4 }}>segundos restantes</div>
          <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, marginTop: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ width: `${progreso}%`, height: "100%", background: "linear-gradient(90deg, #FD7751, #FF9066)", borderRadius: 4, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
          </div>
        </div>

        {videoVisto ? (
          <button
            onClick={onReclamarVideo}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #16C784, #0fa968)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(22,199,132,0.3)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 24px rgba(22,199,132,0.4)" }}
            onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 6px 20px rgba(22,199,132,0.3)" }}
          >
            ✓ Reclamar +{MONEDAS_VIDEO} monedas
          </button>
        ) : (
          <button
            onClick={cerrar}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "var(--texto-sec)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.1)" }}
            onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.05)" }}
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
