import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { auth, db } from "../firebase/config";
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

  const cargarPerfil = async () => {
    const snap = await getDoc(doc(db, "jugadores", usuario.uid));
    if (snap.exists()) setPerfil(snap.data());
  };

  const cargarPartidos = async () => {
    try {
      const res = await client.get("/partidos");
      setPartidos(res.data);
    } catch { console.error("Error cargando partidos"); }
  };

  const cargarRanking = async () => {
    try {
      const q = query(collection(db, "jugadores"), orderBy("monedas", "desc"), limit(10));
      const snap = await getDocs(q);
      setRanking(snap.docs.map((d, i) => ({
        pos: i + 1,
        nombre: d.data().nombre || d.data().email?.split("@")[0] || "Jugador",
        monedas: d.data().monedas || 0,
        predicciones: d.data().predicciones || 0,
        esYo: d.id === usuario.uid,
      })));
    } catch { console.error("Error cargando ranking"); }
  };

  useEffect(() => {
    if (!usuario?.uid) return;
    cargarPerfil();
    cargarPartidos();
    cargarRanking();
  }, [usuario]);

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
              { label: "Predicciones", valor: perfil?.predicciones || 0, icono: "⚽", color: C.azul    },
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
        {tab === "misiones" && <Misiones />}
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

function Misiones() {
  const lista = [
    { icono: "✅", titulo: "Perfil creado",      desc: "Completaste tu registro",          goles: 10, ok: true  },
    { icono: "⚽", titulo: "Primera predicción", desc: "Predice tu primer partido",         goles: 5,  ok: false },
    { icono: "🤝", titulo: "Invita un amigo",    desc: "Refiere un jugador y ganan ambos",  goles: 5,  ok: false },
    { icono: "▶️", titulo: "Ver video CLTiene",  desc: "Mira un video de la marca",         goles: 3,  ok: false },
    { icono: "🧠", titulo: "Trivia del Mundial", desc: "Responde 5 preguntas de fútbol",    goles: 4,  ok: false },
    { icono: "🔥", titulo: "7 días seguidos",    desc: "Ingresa 7 días consecutivos",       goles: 7,  ok: false },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Tus misiones</span>
        <span style={{ background: "rgba(253,119,81,0.2)", color: "#FD7751", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>1 / {lista.length} completadas</span>
      </div>
      <div style={{ background: "rgba(22,199,132,0.1)", border: "1px solid rgba(22,199,132,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚽</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Gana goles completando misiones</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Los goles se acumulan aparte de las monedas</div>
        </div>
      </div>
      {lista.map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: m.ok ? "rgba(22,199,132,0.08)" : "rgba(255,255,255,0.04)", border: m.ok ? "1px solid rgba(22,199,132,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, opacity: m.ok ? 0.8 : 1 }}>
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
              : <button style={{ marginTop: 4, background: "linear-gradient(135deg, #FD7751, #e5622a)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 12px", cursor: "pointer" }}>Ir →</button>
            }
          </div>
        </div>
      ))}
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

      {noticias.map((n, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
          {n.categoria && (
            <span style={{ background: "rgba(130,43,210,0.2)", color: C.morado, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginBottom: 8, display: "inline-block" }}>
              {n.categoria}
            </span>
          )}
          <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: "6px 0 8px", lineHeight: 1.3 }}>{n.titulo}</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{n.resumen}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{n.fecha || "Hoy"}</span>
            {n.fuente && <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Fuente: {n.fuente}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Perfil({ perfil, nombre, monedas, posicion, ranking, usuario }) {
  const goles = perfil?.goles || 0;
  const email = usuario?.email || "";
  const predicciones = perfil?.predicciones || 0;
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
