import { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import logo from "../assets/logo.png";
import client from "../api/client";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { C } from "../components/dashboard/constants";
import Inicio from "../components/dashboard/Inicio";
import Polla from "../components/dashboard/Polla";
import Ranking from "../components/dashboard/Ranking";
import Misiones from "../components/dashboard/Misiones";
import Noticias from "../components/dashboard/Noticias";
import Perfil from "../components/dashboard/Perfil";
import Beneficios from "../components/dashboard/Beneficios";

export default function Dashboard({ usuario, onCerrarSesion }) {
  const [perfil, setPerfil] = useState(null);
  const [tab, setTab] = useState("inicio");
  const [partidos, setPartidos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [toast, setToast] = useState(null);

  const mostrarToast = (mensaje, tipo = "exito") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  useNotificaciones({ uid: usuario?.uid, client });

  const cargarPerfil = () =>
    client.get(`/jugadores/${usuario.uid}`).then(r => setPerfil(r.data)).catch(() => {});

  const cargarPartidos = () =>
    client.get("/partidos").then(r => setPartidos(r.data.map(p => ({
      ...p,
      local: p.local_equipo || p.local,
      visitante: p.visitante_equipo || p.visitante,
      bandera_l: p.bandera_local || p.bandera_l,
      bandera_v: p.bandera_visitante || p.bandera_v,
    })))).catch(() => {});

  const cargarRanking = () =>
    client.get("/ranking?limit=10").then(r => setRanking(r.data.map((j) => ({
      pos: j.posicion,
      nombre: j.nombre || j.email?.split("@")[0] || "Jugador",
      monedas: j.monedas || 0,
      predicciones: j.predicciones_count || 0,
      esYo: j.uid === usuario.uid,
    })))).catch(() => {});

  useEffect(() => {
    if (!usuario?.uid) return;
    Promise.all([cargarPerfil(), cargarPartidos(), cargarRanking()]);
  }, [usuario?.uid]);

  const cerrar = async () => { await signOut(auth); onCerrarSesion?.(); };

  const reclamarBono = async () => {
    try {
      const res = await client.post(`/monedas/bono-diario/${usuario.uid}`);
      mostrarToast(res.data.mensaje, "exito");
      cargarPerfil();
    } catch { mostrarToast("Ya reclamaste tu bono hoy", "error"); }
  };

  const nombre = perfil?.nombre || usuario?.displayName?.split(" ")[0] || "Jugador";
  const monedas = perfil?.monedas || 0;
  const posicion = ranking.find(r => r.esYo)?.pos || "—";

  return (
    <div style={{ minHeight: "100vh", background: "#0f0a1e", fontFamily: "'Segoe UI', sans-serif", paddingBottom: 80 }}>

      {/* NAVBAR */}
      <div style={{ background: "rgba(15,10,30,0.95)", borderBottom: "2px solid #FD7751", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <img src={logo} style={{ height: 28 }} alt="CLTiene" />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="anim-glow" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(236,168,45,0.15)", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 20, padding: "5px 12px" }}>
            <span style={{ fontSize: 16 }}>🪙</span>
            <span style={{ color: C.dorado, fontWeight: 900, fontSize: 16 }}>{monedas}</span>
          </div>
          <div className="anim-glow" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(22,199,132,0.15)", border: "1px solid rgba(22,199,132,0.4)", borderRadius: 20, padding: "5px 12px", animationDelay: "1s" }}>
            <span style={{ fontSize: 16 }}>⚽</span>
            <span style={{ color: C.verde, fontWeight: 900, fontSize: 16 }}>{perfil?.goles || 0}</span>
          </div>
          <button onClick={cerrar} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: C.gris, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13 }}>Salir</button>
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden", padding: "28px 16px 24px", background: "linear-gradient(135deg, #1a0033 0%, #0f0a1e 50%, #001a33 100%)" }}>
        <div style={{ position: "absolute", right: -20, top: -20, fontSize: 120, opacity: 0.07, transform: "rotate(15deg)", userSelect: "none" }}>⚽</div>
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(253,119,81,0.2)", border: "1px solid rgba(253,119,81,0.4)", borderRadius: 20, padding: "4px 12px", marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.verde, display: "inline-block" }} />
            <span style={{ color: C.naranja, fontSize: 12, fontWeight: 700 }}>MUNDIAL 2026 · EN VIVO</span>
          </div>
          <h1 style={{ color: C.blanco, fontSize: 28, fontWeight: 900, margin: "0 0 6px", lineHeight: 1.1 }}>
            ¡Hola, <span style={{ color: C.naranja }}>{nombre}</span>! 👋
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "0 0 20px" }}>
            Predice, acumula monedas y llega al tope del ranking 🏆
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Monedas",      valor: monedas,                   icono: "🪙", color: C.dorado  },
              { label: "Predicciones", valor: perfil?.predicciones_count || 0, icono: "⚽", color: C.azul    },
              { label: "Posición",     valor: `#${posicion}`,            icono: "🏆", color: C.naranja },
            ].map((s, i) => (
              <div key={i} className="anim-slide-up" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${s.color}30`, borderRadius: 14, padding: "14px 10px", textAlign: "center", animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icono}</div>
                <div style={{ color: s.color, fontSize: 20, fontWeight: 900 }}>{s.valor}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 14px" }}>
        {tab === "inicio"   && <Inicio   setTab={setTab} reclamarBono={reclamarBono} partidos={partidos} />}
        {tab === "polla"    && <Polla    usuario={usuario} cargarPerfil={cargarPerfil} partidos={partidos} />}
        {tab === "ranking"  && <Ranking  ranking={ranking} />}
        {tab === "misiones" && <Misiones usuario={usuario} cargarPerfil={cargarPerfil} />}
        {tab === "noticias" && <Noticias />}
        {tab === "beneficios" && <Beneficios usuario={usuario} perfil={perfil} cargarPerfil={cargarPerfil} />}
        {tab === "perfil"   && <Perfil   perfil={perfil} nombre={nombre} monedas={monedas} posicion={posicion} ranking={ranking} usuario={usuario} />}
      </div>

      {/* TOAST */}
      {toast && (
        <div className="anim-slide-up" style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: toast.tipo === "exito" ? "linear-gradient(135deg, #16C784, #0fa968)" : "linear-gradient(135deg, #ED1E28, #c0392b)", borderRadius: 14, padding: "14px 24px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", maxWidth: "90%" }}>
          <span className="anim-coin" style={{ fontSize: 24 }}>{toast.tipo === "exito" ? "🪙" : "⚠️"}</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{toast.mensaje}</span>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,10,30,0.98)", borderTop: "1px solid rgba(253,119,81,0.2)", display: "flex", padding: "6px 0", zIndex: 100, overflowX: "auto" }}>
        {[
          { id: "inicio",     i: "🏠", l: "Inicio"     },
          { id: "polla",      i: "⚽", l: "Polla"      },
          { id: "ranking",    i: "🏆", l: "Ranking"    },
          { id: "misiones",   i: "🎯", l: "Misiones"   },
          { id: "beneficios", i: "🎁", l: "Beneficios" },
          { id: "noticias",   i: "📰", l: "Noticias"   },
          { id: "perfil",     i: "👤", l: "Perfil"     },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0" }}>
            <span style={{ fontSize: 20, filter: tab === t.id ? "none" : "grayscale(1)", opacity: tab === t.id ? 1 : 0.4 }}>{t.i}</span>
            <span style={{ fontSize: 10, color: tab === t.id ? C.naranja : "rgba(255,255,255,0.3)", fontWeight: tab === t.id ? 700 : 400 }}>{t.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
