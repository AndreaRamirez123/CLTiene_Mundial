import { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import logo from "../assets/logo.png";
import client from "../api/client";
import { obtenerNoticiasMundial } from "../api/gemini";
import { useNotificaciones } from "../hooks/useNotificaciones";

const C = {
  naranja: "#FD7751", dorado: "#ECA82D", morado: "#822BD2",
  rosa: "#FC3276", azul: "#408DFF", verde: "#16C784",
  rojo: "#ED1E28", gris: "#999999", blanco: "#FFFFFF", negro: "#231F20",
};

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const [, mes, dia] = fecha.split("-");
  return `${dia} ${meses[parseInt(mes) - 1]}`;
};

const Bandera = ({ codigo, nombre, size = 36 }) => (
  <img
    src={`https://flagcdn.com/${size === 36 ? "48x36" : "32x24"}/${codigo}.png`}
    alt={nombre}
    style={{ width: size === 36 ? 48 : 32, height: size, borderRadius: 4, objectFit: "cover" }}
    onError={(e) => { e.target.style.display = "none"; }}
  />
);

export default function Dashboard({ usuario, onCerrarSesion }) {
  const [perfil, setPerfil] = useState(null);
  const [tab, setTab] = useState("inicio");
  const [partidos, setPartidos] = useState([]);
  const [ranking, setRanking] = useState([]);

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
      alert(res.data.mensaje);
      await cargarPerfil();
    } catch { alert("Ya reclamaste tu bono hoy o hubo un error"); }
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(236,168,45,0.15)", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 20, padding: "5px 12px" }}>
            <span style={{ fontSize: 16 }}>🪙</span>
            <span style={{ color: C.dorado, fontWeight: 900, fontSize: 16 }}>{monedas}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(22,199,132,0.15)", border: "1px solid rgba(22,199,132,0.4)", borderRadius: 20, padding: "5px 12px" }}>
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
              <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${s.color}30`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
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
        {tab === "polla"    && <Polla    monedas={monedas} usuario={usuario} cargarPerfil={cargarPerfil} partidos={partidos} />}
        {tab === "ranking"  && <Ranking  ranking={ranking} />}
        {tab === "misiones" && <Misiones usuario={usuario} cargarPerfil={cargarPerfil} />}
        {tab === "noticias" && <Noticias />}
        {tab === "perfil"   && <Perfil   perfil={perfil} nombre={nombre} monedas={monedas} posicion={posicion} ranking={ranking} usuario={usuario} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,10,30,0.98)", borderTop: "1px solid rgba(253,119,81,0.2)", display: "flex", padding: "6px 0", zIndex: 100 }}>
        {[
          { id: "inicio",   i: "🏠", l: "Inicio"   },
          { id: "polla",    i: "⚽", l: "Polla"    },
          { id: "ranking",  i: "🏆", l: "Ranking"  },
          { id: "misiones", i: "🎯", l: "Misiones" },
          { id: "noticias", i: "📰", l: "Noticias" },
          { id: "perfil",   i: "👤", l: "Perfil"   },
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

function Inicio({ setTab, reclamarBono, partidos }) {
  const proximos = partidos.filter(p => p.estado === "pendiente").slice(0, 3);
  return (
    <div>
      {/* Cuenta regresiva */}
      <div style={{ background: "linear-gradient(135deg, #7c1a8c, #1a0f3d)", border: "1px solid rgba(130,43,210,0.5)", borderRadius: 16, padding: "18px 16px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: 0.1 }}>🌎</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>El torneo comienza en</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {[["85", "DÍAS"], ["14", "HRS"], ["32", "MIN"]].map(([n, l]) => (
            <div key={l} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 56 }}>
              <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{n}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>🏟️ USA · México · Canadá 2026</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>⚽ Próximos partidos</span>
        <button onClick={() => setTab("polla")} style={{ background: "none", border: "none", color: "#FD7751", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Predecir todos →</button>
      </div>

      {proximos.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Cargando partidos...</div>
      ) : proximos.map((p) => (
        <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Grupo {p.grupo}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>📅 {formatearFecha(p.fecha)} · {p.hora}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <Bandera codigo={p.bandera_l} nombre={p.local} />
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginTop: 6 }}>{p.local}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>VS</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Bandera codigo={p.bandera_v} nombre={p.visitante} />
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginTop: 6 }}>{p.visitante}</div>
            </div>
          </div>
          <button onClick={() => setTab("polla")} style={{ width: "100%", marginTop: 12, padding: "9px", background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ⚽ Hacer predicción
          </button>
        </div>
      ))}

      {/* Bono diario */}
      <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.2), rgba(253,119,81,0.1))", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 14, padding: "16px", marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#ECA82D", fontWeight: 800, fontSize: 15 }}>🪙 Bono diario</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 3 }}>Tienes monedas esperándote</div>
        </div>
        <button onClick={reclamarBono} style={{ background: "linear-gradient(135deg, #ECA82D, #c9891a)", border: "none", borderRadius: 10, color: "#231F20", fontWeight: 800, fontSize: 14, padding: "10px 18px", cursor: "pointer" }}>
          ¡Reclamar!
        </button>
      </div>
    </div>
  );
}

function Polla({ monedas, usuario, cargarPerfil, partidos }) {
  const [preds, setPreds] = useState({});
  const [enviando, setEnviando] = useState({});
  const set = (id, k, v) => setPreds((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  const confirmar = async (partido) => {
    const pred = preds[partido.id];
    if (!pred?.resultado) { alert("Selecciona un resultado (Local / Empate / Visitante)"); return; }
    if (!pred?.apuesta || Number(pred.apuesta) < 10) { alert("Mínimo 10 monedas de apuesta"); return; }
    setEnviando((e) => ({ ...e, [partido.id]: true }));
    try {
      const res = await client.post(`/predicciones/${usuario.uid}`, {
        partido_id: String(partido.id),
        resultado: pred.resultado,
        goles_local: Number(pred.gl) || 0,
        goles_visitante: Number(pred.gv) || 0,
        monedas_apostadas: Number(pred.apuesta),
      });
      alert(res.data.mensaje);
      await cargarPerfil();
    } catch (e) {
      alert(e.response?.data?.message || "Error al guardar predicción");
    } finally {
      setEnviando((e) => ({ ...e, [partido.id]: false }));
    }
  };

  const pendientes = partidos.filter(p => p.estado === "pendiente");

  return (
    <div>
      <div style={{ background: "rgba(64,141,255,0.1)", border: "1px solid rgba(64,141,255,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Tienes 🪙 {monedas} monedas</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Mínimo 10 por partido · Si aciertas ganas el doble</div>
        </div>
      </div>

      {pendientes.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Cargando partidos...</div>
      ) : pendientes.map((p) => (
        <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Grupo {p.grupo}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>📅 {formatearFecha(p.fecha)} · {p.hora}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}>
              <Bandera codigo={p.bandera_l} nombre={p.local} size={36} />
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, marginTop: 6 }}>{p.local}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px" }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700 }}>VS</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Bandera codigo={p.bandera_v} nombre={p.visitante} size={36} />
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, marginTop: 6 }}>{p.visitante}</div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>¿Quién gana?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { val: "local",     label: p.local,    codigo: p.bandera_l },
                { val: "empate",    label: "Empate",   codigo: null },
                { val: "visitante", label: p.visitante, codigo: p.bandera_v },
              ].map((op) => (
                <button key={op.val} onClick={() => set(p.id, "resultado", op.val)} style={{ padding: "10px 6px", borderRadius: 10, cursor: "pointer", border: preds[p.id]?.resultado === op.val ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.1)", background: preds[p.id]?.resultado === op.val ? "rgba(253,119,81,0.2)" : "rgba(255,255,255,0.04)", color: preds[p.id]?.resultado === op.val ? "#FD7751" : "rgba(255,255,255,0.6)", fontWeight: preds[p.id]?.resultado === op.val ? 800 : 400, fontSize: 12, textAlign: "center" }}>
                  <div style={{ marginBottom: 3, display: "flex", justifyContent: "center" }}>
                    {op.codigo
                      ? <Bandera codigo={op.codigo} nombre={op.label} size={24} />
                      : <span style={{ fontSize: 18 }}>🤝</span>
                    }
                  </div>
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 6, fontWeight: 700 }}>Marcador exacto</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" min="0" max="20" placeholder="0" value={preds[p.id]?.gl || ""} onChange={(e) => set(p.id, "gl", e.target.value)} style={{ width: 48, padding: "8px", textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 16, outline: "none" }} />
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, fontWeight: 700 }}>-</span>
                <input type="number" min="0" max="20" placeholder="0" value={preds[p.id]?.gv || ""} onChange={(e) => set(p.id, "gv", e.target.value)} style={{ width: 48, padding: "8px", textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 16, outline: "none" }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              
              <input type="number" min="10" placeholder="10" value={preds[p.id]?.apuesta || ""} onChange={(e) => set(p.id, "apuesta", e.target.value)} style={{ width: "100%", padding: "8px", textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#ECA82D", fontSize: 15, fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          <button onClick={() => confirmar(p)} disabled={enviando[p.id]} style={{ width: "100%", padding: "12px", background: enviando[p.id] ? "rgba(253,119,81,0.5)" : "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: enviando[p.id] ? "not-allowed" : "pointer" }}>
            {enviando[p.id] ? "Guardando..." : "⚽ Confirmar predicción"}
          </button>
        </div>
      ))}
    </div>
  );
}

function Ranking({ ranking }) {
  const medallas = ["🥇", "🥈", "🥉"];
  const yo = ranking.find(r => r.esYo);
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.15), rgba(253,119,81,0.1))", border: "1px solid rgba(236,168,45,0.3)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Tu posición actual</div>
        <div style={{ color: "#ECA82D", fontSize: 36, fontWeight: 900 }}>#{yo?.pos || "—"}</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>¡Sigue prediciendo para subir!</div>
      </div>
      {ranking.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Cargando ranking...</div>
      ) : ranking.map((j, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: j.esYo ? "rgba(253,119,81,0.1)" : "rgba(255,255,255,0.04)", border: j.esYo ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ fontSize: i < 3 ? 28 : 16, fontWeight: 900, color: "#ECA82D", minWidth: 36, textAlign: "center" }}>
            {i < 3 ? medallas[i] : `#${j.pos}`}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: j.esYo ? "#FD7751" : "#fff", fontWeight: 800, fontSize: 15 }}>
              {j.nombre} {j.esYo ? "👈 Tú" : ""}
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>{j.predicciones} predicciones</div>
          </div>
          <div style={{ color: "#ECA82D", fontWeight: 900, fontSize: 16 }}>🪙 {j.monedas}</div>
        </div>
      ))}
    </div>
  );
}

function Misiones({ usuario, cargarPerfil }) {
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
      <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.5)" }}>
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
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Tus misiones</span>
        <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{completadas} / {total} completadas</span>
      </div>
      <div style={{ background: "rgba(22,199,132,0.1)", border: "1px solid rgba(22,199,132,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚽</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Gana goles completando misiones</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Los goles se acumulan aparte de las monedas</div>
        </div>
      </div>
      {misiones.map((m) => (
        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, background: m.ok ? "rgba(22,199,132,0.08)" : "rgba(255,255,255,0.04)", border: m.ok ? "1px solid rgba(22,199,132,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, opacity: m.ok ? 0.8 : 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: m.ok ? "rgba(22,199,132,0.15)" : "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {m.icono}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: m.ok ? "#16C784" : "#fff", fontWeight: 700, fontSize: 14 }}>{m.titulo}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>{m.desc}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: C.verde, fontWeight: 900, fontSize: 14 }}>+{m.goles} ⚽</div>
            {m.ok
              ? <div style={{ color: "#16C784", fontSize: 11, marginTop: 3 }}>✓ Listo</div>
              : <button
                  onClick={() => reclamar(m.id)}
                  disabled={reclamando === m.id}
                  style={{ marginTop: 4, background: reclamando === m.id ? "#666" : "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 12px", cursor: reclamando === m.id ? "wait" : "pointer" }}
                >
                  {reclamando === m.id ? "..." : m.id === "invita_amigo" ? "Compartir →" : m.id === "ver_video" ? "Ver video →" : m.id === "trivia_mundial" ? "Jugar trivia →" : "Reclamar →"}
                </button>
            }
          </div>
        </div>
      ))}

      {/* Modal compartir en redes sociales */}
      {mostrarCompartir && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={() => setMostrarCompartir(false)}>
          <div style={{ background: "#1a1130", borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "90%", border: "1px solid rgba(253,119,81,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>Invita a un amigo</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6 }}>Cuando alguien se registre con tu enlace, ganas +5 ⚽</div>
            </div>
            <div style={{ background: "rgba(236,168,45,0.15)", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4 }}>Tu codigo de referido</div>
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
                  <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.4)", fontSize: 18 }}>→</span>
                </button>
              ))}
            </div>
            <button onClick={() => setMostrarCompartir(false)} style={{ marginTop: 16, width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal ver video */}
      {mostrarVideo && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1a1130", borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "95%", border: "1px solid rgba(253,119,81,0.3)" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>▶️</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>Video CLTiene</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>
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
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4 }}>Podras reclamar en</div>
                  <div style={{ color: C.naranja, fontWeight: 900, fontSize: 24 }}>
                    {SEGUNDOS_MINIMO - tiempoVideo}s
                  </div>
                  <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(tiempoVideo / SEGUNDOS_MINIMO) * 100}%`, background: `linear-gradient(90deg, ${C.naranja}, ${C.dorado})`, borderRadius: 2, transition: "width 1s linear" }} />
                  </div>
                </div>
                <button onClick={() => setMostrarVideo(false)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
                  style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(253,119,81,0.4)" }}
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
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>Trivia del Mundial</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>
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
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>
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
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ color, fontWeight: 600, fontSize: 14, textAlign: "left" }}>{op}</span>
                        {yaRespondio && esSeleccionada && esCorrecta && <span style={{ marginLeft: "auto", fontSize: 16 }}>✓</span>}
                        {yaRespondio && esSeleccionada && !esCorrecta && <span style={{ marginLeft: "auto", fontSize: 16 }}>✗</span>}
                      </button>
                    );
                  })}
                </div>

                <button onClick={() => setMostrarTrivia(false)} style={{ marginTop: 14, width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, marginBottom: 6 }}>
                  {triviaResultado.correctas === 5 ? "¡Perfecto!" : triviaResultado.correctas >= 3 ? "¡Muy bien!" : "¡Buen intento!"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 8 }}>
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
                  style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(253,119,81,0.4)" }}
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

function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarNoticias = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerNoticiasMundial();
      setNoticias(data);
    } catch {
      setError("No se pudieron cargar las noticias");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarNoticias(); }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>📰 Noticias del Mundial</span>
        <button onClick={cargarNoticias} disabled={cargando} style={{ background: "none", border: "none", color: C.naranja, fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
          {cargando ? "Cargando..." : "Actualizar ↻"}
        </button>
      </div>

      <div style={{ background: "rgba(64,141,255,0.1)", border: "1px solid rgba(64,141,255,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Noticias</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Lo último del Mundial 2026 actualizado para ti</div>
        </div>
      </div>

      {cargando && noticias.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: "spin 1s linear infinite" }}>⚽</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Buscando noticias...</div>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(237,30,40,0.1)", border: "1px solid rgba(237,30,40,0.3)", borderRadius: 12, padding: "16px", textAlign: "center", marginBottom: 16 }}>
          <div style={{ color: C.rojo, fontSize: 14, marginBottom: 8 }}>{error}</div>
          <button onClick={cargarNoticias} style={{ background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 16px", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      )}

      {noticias.map((n, i) => {
        const categoriaColor = {
          Selecciones: { bg: "rgba(253,119,81,0.15)", color: C.naranja },
          Sedes: { bg: "rgba(130,43,210,0.15)", color: C.morado },
          Clasificación: { bg: "rgba(64,141,255,0.15)", color: C.azul },
          Jugadores: { bg: "rgba(22,199,132,0.15)", color: C.verde },
          FIFA: { bg: "rgba(236,168,45,0.15)", color: C.dorado },
        }[n.categoria] || { bg: "rgba(255,255,255,0.1)", color: "#fff" };

        return (
          <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px", marginBottom: 14, position: "relative", overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.naranja; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(253,119,81,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Decoración de fondo */}
            <div style={{ position: "absolute", right: -15, top: -15, fontSize: 60, opacity: 0.04, userSelect: "none" }}>📰</div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {n.categoria && (
                <span style={{ background: categoriaColor.bg, color: categoriaColor.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                  {n.categoria}
                </span>
              )}
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>📅 {n.fecha || "Hoy"}</span>
            </div>

            <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 }}>{n.titulo}</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>{n.resumen}</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              {n.fuente && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: categoriaColor.color }} />
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{n.fuente}</span>
                </div>
              )}
              <span style={{ background: "linear-gradient(135deg, #FD7751, #e5622a)", padding: "5px 14px", borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 700 }}>
                Leer artículo →
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function Perfil({ perfil, nombre, monedas, posicion, ranking, usuario }) {
  const goles = perfil?.goles || 0;
  const email = usuario?.email || "";
  const predicciones = perfil?.predicciones_count || 0;
  const nivel = perfil?.nivel || 1;

  return (
    <div>
      {/* Avatar y nombre */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #822BD2, #408DFF)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 36, fontWeight: 900, color: "#fff", border: "3px solid #FD7751" }}>
          {nombre.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>{nombre}</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>{email}</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(130,43,210,0.2)", border: "1px solid rgba(130,43,210,0.4)", borderRadius: 20, padding: "4px 14px", marginTop: 8 }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ color: C.morado, fontSize: 13, fontWeight: 700 }}>Nivel {nivel}</span>
        </div>
      </div>

      {/* Stats: Monedas y Goles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "rgba(236,168,45,0.1)", border: "1px solid rgba(236,168,45,0.3)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🪙</div>
          <div style={{ color: C.dorado, fontSize: 28, fontWeight: 900 }}>{monedas}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>Monedas</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>Ganas en la Polla</div>
        </div>
        <div style={{ background: "rgba(22,199,132,0.1)", border: "1px solid rgba(22,199,132,0.3)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>⚽</div>
          <div style={{ color: C.verde, fontSize: 28, fontWeight: 900 }}>{goles}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>Goles</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>Ganas en Misiones</div>
        </div>
      </div>

      {/* Más estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px", textAlign: "center" }}>
          <div style={{ color: C.naranja, fontSize: 24, fontWeight: 900 }}>#{posicion}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Ranking</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px", textAlign: "center" }}>
          <div style={{ color: C.azul, fontSize: 24, fontWeight: 900 }}>{predicciones}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Predicciones</div>
        </div>
      </div>

      {/* Mini ranking - top 3 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>🏆 Top 3 del ranking</div>
        {ranking.slice(0, 3).map((j, i) => {
          const medallas = ["🥇", "🥈", "🥉"];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: j.esYo ? "rgba(253,119,81,0.1)" : "rgba(255,255,255,0.04)", border: j.esYo ? "2px solid #FD7751" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{medallas[i]}</span>
              <div style={{ flex: 1 }}>
                <span style={{ color: j.esYo ? C.naranja : "#fff", fontWeight: 700, fontSize: 14 }}>{j.nombre} {j.esYo ? "👈" : ""}</span>
              </div>
              <span style={{ color: C.dorado, fontWeight: 900, fontSize: 14 }}>🪙 {j.monedas}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
