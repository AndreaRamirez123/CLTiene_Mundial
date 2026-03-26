import { useState, useEffect } from "react";
import { getLogoMarca, getNombreMarca } from "../utils/marca";
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
import AdminPanel from "../components/dashboard/AdminPanel";
import { useTheme, ThemeToggle } from "../store/useTheme";
export default function Dashboard({ usuario, onCerrarSesion }) {
  useTheme();
  const [perfil, setPerfil] = useState(null);
  const [tab, setTab] = useState("inicio");
  const [partidos, setPartidos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [toast, setToast] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Fechas del Mundial 2026: 15 de junio - 13 de julio
  const MUNDIAL_INICIO = new Date(2026, 5, 15); // Junio 15
  const MUNDIAL_FIN = new Date(2026, 6, 13); // Julio 13
  const ahora = new Date();
  const estaAntesDeMundial = ahora < MUNDIAL_INICIO;
  const estaEnMundial = ahora >= MUNDIAL_INICIO && ahora <= MUNDIAL_FIN;
  const estaDespuesDeMundial = ahora > MUNDIAL_FIN;
  const diasAlMundial = Math.ceil((MUNDIAL_INICIO - ahora) / (1000 * 60 * 60 * 24));

  const mostrarToast = (mensaje, tipo = "exito") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  useNotificaciones({ uid: usuario?.uid, client });

  const cargarPerfil = () =>
    client.get(`/jugadores/${usuario.uid}`).then((r) => setPerfil(r.data)).catch(() => { });

  const cargarPartidos = () =>
    client.get("/partidos").then((r) =>
      setPartidos(
        r.data.map((p) => ({
          ...p,
          local: p.local_equipo || p.local,
          visitante: p.visitante_equipo || p.visitante,
          bandera_l: p.bandera_local || p.bandera_l,
          bandera_v: p.bandera_visitante || p.bandera_v,
        })),
      ),
    ).catch(() => { });

  const cargarRanking = () =>
    client.get("/ranking?limit=10").then((r) =>
      setRanking(
        r.data.map((j) => ({
          pos: j.posicion,
          nombre: j.nombre || j.email?.split("@")[0] || "Jugador",
          monedas: j.monedas || 0,
          predicciones: j.predicciones_count || 0,
          esYo: j.uid === usuario.uid,
        })),
      ),
    ).catch(() => { });

  useEffect(() => {
    if (!usuario?.uid) return;
    cargarPerfil();
    cargarPartidos();
    cargarRanking();
  }, [usuario?.uid]);

  const cerrar = () => {
    onCerrarSesion?.();
  };

  const reclamarBono = async () => {
    try {
      const res = await client.post(`/monedas/bono-diario/${usuario.uid}`);
      mostrarToast(res.data.mensaje, "exito");
      cargarPerfil();
    } catch {
      mostrarToast("Ya reclamaste tu bono hoy", "error");
    }
  };

  const nombre = perfil?.nombre || usuario?.displayName?.split(" ")[0] || "Jugador";
  const monedas = perfil?.monedas || 0;
  const posicion = ranking.find((r) => r.esYo)?.pos || "—";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Segoe UI', sans-serif", paddingBottom: 80, transition: "background 0.3s ease", color: "var(--texto)" }}>
      <div style={{ background: "var(--navbar)", borderBottom: `2px solid ${C.naranja}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, transition: "background 0.3s ease" }}>
        <img src={getLogoMarca()} className="logo-header" style={{ height: 28 }} alt={getNombreMarca()} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div id="tutorial-monedas" className="anim-glow micro-card" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(236,168,45,0.15)", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 20, padding: "5px 12px" }}>
            <span className="anim-coin" style={{ fontSize: 16 }}>🪙</span>
            <span className="anim-count" style={{ color: C.dorado, fontWeight: 900, fontSize: 16 }}>{monedas}</span>
          </div>
          <div id="tutorial-goles" className="anim-glow micro-card" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(22,199,132,0.15)", border: "1px solid rgba(22,199,132,0.4)", borderRadius: 20, padding: "5px 12px", animationDelay: "1s" }}>
            <span className="anim-goal-flash" style={{ fontSize: 16 }}>⚽</span>
            <span className="anim-count" style={{ color: C.verde, fontWeight: 900, fontSize: 16 }}>{perfil?.goles || 0}</span>
          </div>
          <ThemeToggle />
          <button onClick={cerrar} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: C.gris, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13 }}>Salir</button>
        </div>
      </div>

      <div style={{ position: "relative", overflow: "hidden", padding: "28px 16px 24px", background: "var(--bg-gradient)" }}>
        <div className="anim-goal-flash" style={{ position: "absolute", right: -20, top: -20, fontSize: 120, opacity: 0.07, transform: "rotate(15deg)", userSelect: "none" }}>⚽</div>
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          {estaAntesDeMundial && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(253,119,81,0.15)", border: "1.5px solid rgba(253,119,81,0.4)", borderRadius: 20, padding: "6px 14px", marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>🏆</span>
              <span style={{ color: C.naranja, fontSize: 12, fontWeight: 700 }}>MUNDIAL 2026 · {diasAlMundial} DÍAS</span>
            </div>
          )}
          {estaEnMundial && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(253,119,81,0.2)", border: "1px solid rgba(253,119,81,0.4)", borderRadius: 20, padding: "4px 12px", marginBottom: 10 }}>
              <span className="anim-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: C.verde, display: "inline-block" }} />
              <span style={{ color: C.naranja, fontSize: 12, fontWeight: 700 }}>MUNDIAL 2026 · EN VIVO</span>
            </div>
          )}
          <h1 style={{ color: "var(--texto)", fontSize: 28, fontWeight: 900, margin: "0 0 6px", lineHeight: 1.1 }}>
            ¡Hola, <span style={{ color: C.naranja }}>{nombre}</span>! 👋
          </h1>
          <p style={{ color: "var(--texto-sec)", fontSize: 14, margin: "0 0 20px" }}>
            Predice, acumula monedas y llega al tope del ranking 🏆
          </p>
          <div id="tutorial-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Monedas", valor: monedas, icono: "🪙", color: C.dorado, anim: "anim-coin" },
              { label: "Predicciones", valor: perfil?.predicciones_count || 0, icono: "⚽", color: C.azul, anim: "anim-goal-flash" },
              { label: "Posición", valor: `#${posicion}`, icono: "🏆", color: C.naranja, anim: "anim-trophy" },
            ].map((s, i) => (
              <div key={i} className="anim-slide-up micro-card anim-stadium-glow" style={{ background: "var(--card)", border: `1px solid ${s.color}30`, borderRadius: 14, padding: "14px 10px", textAlign: "center", animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
                <div className={s.anim} style={{ fontSize: 22, marginBottom: 4 }}>{s.icono}</div>
                <div className="anim-count" style={{ color: s.color, fontSize: 20, fontWeight: 900 }}>{s.valor}</div>
                <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 14px" }}>
        {tab === "inicio" && <Inicio setTab={setTab} reclamarBono={reclamarBono} partidos={partidos} usuario={usuario} />}
        {tab === "polla" && <Polla usuario={usuario} cargarPerfil={cargarPerfil} partidos={partidos} />}
        {tab === "ranking" && <Ranking ranking={ranking} />}
        {tab === "misiones" && <Misiones usuario={usuario} cargarPerfil={cargarPerfil} />}
        {tab === "noticias" && <Noticias />}
        {tab === "beneficios" && <Beneficios usuario={usuario} perfil={perfil} cargarPerfil={cargarPerfil} />}
        {tab === "perfil" && <Perfil perfil={perfil} nombre={nombre} monedas={monedas} posicion={posicion} ranking={ranking} usuario={usuario} />}
        {tab === "admin" && (perfil?.rol === "admin" || perfil?.rol === "superadmin") && (
          <AdminPanel usuario={usuario} client={client} />
        )}
      </div>


      {toast && (
        <div className={`anim-slide-up ${toast.tipo === "exito" ? "anim-success-ring" : "anim-shake"}`} style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: toast.tipo === "exito" ? "linear-gradient(135deg, #16C784, #0fa968)" : "linear-gradient(135deg, #ED1E28, #c0392b)", borderRadius: 14, padding: "14px 24px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", maxWidth: "90%" }}>
          <span className={toast.tipo === "exito" ? "anim-coin" : "anim-shake"} style={{ fontSize: 24 }}>{toast.tipo === "exito" ? "🪙" : "⚠️"}</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{toast.mensaje}</span>
        </div>
      )}

      {/* Barra inferior DESKTOP: todos los tabs (oculta en móvil) */}
      <div id="tutorial-navbar" className="nav-desktop" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--navbar)", borderTop: "1px solid var(--nav-border)", display: "flex", padding: "6px 0", zIndex: 100, transition: "background 0.3s ease" }}>
        {[
          { id: "inicio", i: "🏠", l: "Inicio" },
          { id: "polla", i: "⚽", l: "Polla" },
          { id: "ranking", i: "🏆", l: "Ranking" },
          { id: "misiones", i: "🎯", l: "Misiones" },
          { id: "beneficios", i: "🎁", l: "Beneficios" },
          { id: "noticias", i: "📰", l: "Noticias" },
          { id: "perfil", i: "👤", l: "Perfil" },
          ...((perfil?.rol === "admin" || perfil?.rol === "superadmin")
            ? [{ id: "admin", i: "🛡️", l: "Admin" }]
            : []),
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0" }}>
            <span style={{ fontSize: 20, filter: tab === t.id ? "none" : "grayscale(1)", opacity: tab === t.id ? 1 : 0.4 }}>{t.i}</span>
            <span style={{ fontSize: 10, color: tab === t.id ? (t.id === "admin" ? "#FF6B00" : C.naranja) : "var(--texto-ter)", fontWeight: tab === t.id ? 700 : 400 }}>{t.l}</span>
          </button>
        ))}
      </div>

      {/* Barra inferior MÓVIL: 4 tabs + hamburguesa (oculta en desktop) */}
      <div className="nav-mobile" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--navbar)", borderTop: "1px solid var(--nav-border)", display: "none", padding: "6px 0", zIndex: 100, transition: "background 0.3s ease" }}>
        {[
          { id: "inicio", i: "🏠", l: "Inicio" },
          { id: "polla", i: "⚽", l: "Polla" },
          { id: "ranking", i: "🏆", l: "Ranking" },
          { id: "misiones", i: "🎯", l: "Misiones" },
        ].map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMenuAbierto(false); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0" }}>
            <span style={{ fontSize: 20, filter: tab === t.id ? "none" : "grayscale(1)", opacity: tab === t.id ? 1 : 0.4 }}>{t.i}</span>
            <span style={{ fontSize: 10, color: tab === t.id ? C.naranja : "var(--texto-ter)", fontWeight: tab === t.id ? 700 : 400 }}>{t.l}</span>
          </button>
        ))}
        <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0" }}>
          <span style={{ fontSize: 18, opacity: menuAbierto ? 1 : 0.5, color: menuAbierto ? C.naranja : "var(--texto)", lineHeight: 1.2 }}>{menuAbierto ? "✕" : "•••"}</span>
          <span style={{ fontSize: 10, color: menuAbierto ? C.naranja : "var(--texto-ter)", fontWeight: menuAbierto ? 700 : 400 }}>Más</span>
        </button>
      </div>

      {/* Menú desplegable hamburguesa (solo móvil) */}
      {menuAbierto && (
        <div style={{ position: "fixed", bottom: 56, left: 0, right: 0, zIndex: 99 }} onClick={() => setMenuAbierto(false)}>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", background: "var(--navbar)", borderTop: "1px solid var(--nav-border)", borderRadius: "16px 16px 0 0", padding: "16px 20px 8px", maxWidth: 600, margin: "0 auto" }} onClick={(e) => e.stopPropagation()}>
            {[
              { id: "beneficios", i: "🎁", l: "Beneficios" },
              { id: "noticias", i: "📰", l: "Noticias" },
              { id: "perfil", i: "👤", l: "Perfil" },
              ...((perfil?.rol === "admin" || perfil?.rol === "superadmin")
                ? [{ id: "admin", i: "🛡️", l: "Admin" }]
                : []),
            ].map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); setMenuAbierto(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 14,
                padding: "12px 14px", marginBottom: 4, borderRadius: 12, border: "none", cursor: "pointer",
                background: tab === t.id ? `${C.naranja}20` : "transparent",
                transition: "background 0.2s",
              }}>
                <span style={{ fontSize: 22 }}>{t.i}</span>
                <span style={{ fontSize: 15, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? C.naranja : "var(--texto)" }}>{t.l}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
