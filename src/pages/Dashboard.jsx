import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import logo from "../assets/logo.png";

const C = {
  naranja: "#FD7751", dorado: "#ECA82D", morado: "#822BD2",
  rosa: "#FC3276", azul: "#408DFF", verde: "#16C784",
  rojo: "#ED1E28", gris: "#999999", blanco: "#FFFFFF", negro: "#231F20",
};

const PARTIDOS = [
  { id: 1, local: "México",    bandera_l: "🇲🇽", visitante: "Polonia",    bandera_v: "🇵🇱", fecha: "11 Jun", hora: "12:00", fase: "Fase de Grupos" },
  { id: 2, local: "Argentina", bandera_l: "🇦🇷", visitante: "Arabia S.",  bandera_v: "🇸🇦", fecha: "11 Jun", hora: "15:00", fase: "Fase de Grupos" },
  { id: 3, local: "Francia",   bandera_l: "🇫🇷", visitante: "Australia",  bandera_v: "🇦🇺", fecha: "12 Jun", hora: "09:00", fase: "Fase de Grupos" },
  { id: 4, local: "Brasil",    bandera_l: "🇧🇷", visitante: "Serbia",     bandera_v: "🇷🇸", fecha: "12 Jun", hora: "18:00", fase: "Fase de Grupos" },
];

const RANKING = [
  { pos: 1, nombre: "Carlos M.",  monedas: 4850, aciertos: 24 },
  { pos: 2, nombre: "Laura G.",   monedas: 4200, aciertos: 21 },
  { pos: 3, nombre: "Andrés R.",  monedas: 3900, aciertos: 19 },
  { pos: 4, nombre: "Tú",         monedas: 100,  aciertos: 0, esYo: true },
];

export default function Dashboard({ usuario, onCerrarSesion }) {
  const [perfil, setPerfil] = useState(null);
  const [tab, setTab] = useState("inicio");

  useEffect(() => {
    if (!usuario?.uid) return;
    getDoc(doc(db, "jugadores", usuario.uid)).then(snap => {
      if (snap.exists()) setPerfil(snap.data());
    });
  }, [usuario]);

  const nombre = perfil?.nombre || usuario?.displayName?.split(" ")[0] || "Jugador";
  const monedas = perfil?.monedas || 0;
  const cerrar = async () => { await signOut(auth); onCerrarSesion?.(); };

  return (
    <div style={{ minHeight: "100vh", background: "#1a1025", fontFamily: "'Segoe UI', sans-serif", paddingBottom: 80 }}>

      {/* NAVBAR */}
      <div style={{ background: "rgba(15,10,30,0.95)", borderBottom: "2px solid #FD7751", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <img src={logo} style={{ height: 28 }} alt="CLTiene" />
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(236,168,45,0.15)", border: "1px solid rgba(236,168,45,0.4)", borderRadius: 20, padding: "5px 12px" }}>
          <span style={{ fontSize: 18 }}>🪙</span>
          <span style={{ color: C.dorado, fontWeight: 900, fontSize: 18 }}>{monedas}</span>
        </div>
        <button onClick={cerrar} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: C.gris, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13 }}>Salir</button>
      </div>

      {/* HERO BANNER */}
      <div style={{ position: "relative", overflow: "hidden", padding: "28px 16px 24px", background: "linear-gradient(135deg, #1a0033 0%, #0f0a1e 50%, #001a33 100%)" }}>
        {/* Decoración fútbol */}
        <div style={{ position: "absolute", right: -20, top: -20, fontSize: 120, opacity: 0.07, transform: "rotate(15deg)", userSelect: "none" }}>⚽</div>
        <div style={{ position: "absolute", left: -10, bottom: -10, fontSize: 80, opacity: 0.05, transform: "rotate(-20deg)", userSelect: "none" }}>🏆</div>

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

          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Monedas", valor: monedas, icono: "🪙", color: C.dorado },
              { label: "Predicciones", valor: perfil?.predicciones || 0, icono: "⚽", color: C.azul },
              { label: "Posición", valor: "#" + (RANKING.find(r => r.esYo)?.pos || "—"), icono: "🏆", color: C.naranja },
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

      {/* TABS */}
      <div style={{ display: "flex", background: "#1a1025", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 8px", overflowX: "auto", position: "sticky", top: 52, zIndex: 99 }}>
        {[
          { id: "inicio", label: "Inicio", icono: "🏠" },
          { id: "polla", label: "Polla", icono: "⚽" },
          { id: "ranking", label: "Ranking", icono: "🏆" },
          { id: "misiones", label: "Misiones", icono: "🎯" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "14px 8px", background: "transparent", border: "none",
            borderBottom: tab === t.id ? `3px solid ${C.naranja}` : "3px solid transparent",
            color: tab === t.id ? C.naranja : "rgba(255,255,255,0.4)",
            fontSize: 12, fontWeight: tab === t.id ? 800 : 500,
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 18 }}>{t.icono}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 14px" }}>
        {tab === "inicio" && <Inicio setTab={setTab} monedas={monedas} />}
        {tab === "polla" && <Polla monedas={monedas} />}
        {tab === "ranking" && <Ranking />}
        {tab === "misiones" && <Misiones />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,10,30,0.98)", borderTop: "1px solid rgba(253,119,81,0.2)", display: "flex", padding: "6px 0", zIndex: 100 }}>
        {[
          { id: "inicio", i: "🏠", l: "Inicio" },
          { id: "polla", i: "⚽", l: "Polla" },
          { id: "ranking", i: "🏆", l: "Ranking" },
          { id: "misiones", i: "🎯", l: "Misiones" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0",
          }}>
            <span style={{ fontSize: 20, filter: tab === t.id ? "none" : "grayscale(1)", opacity: tab === t.id ? 1 : 0.4 }}>{t.i}</span>
            <span style={{ fontSize: 10, color: tab === t.id ? C.naranja : "rgba(255,255,255,0.3)", fontWeight: tab === t.id ? 700 : 400 }}>{t.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Inicio({ setTab, monedas }) {
  return (
    <div>
      {/* Cuenta regresiva */}
      <div style={{ background: "linear-gradient(135deg, #7c1a8c, #1a0f3d)", border: "1px solid rgba(130,43,210,0.5)", borderRadius: 16, padding: "18px 16px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: 0.1 }}>🌎</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 4 }}>El torneo comienza en</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {[["85", "DÍAS"], ["14", "HRS"], ["32", "MIN"]].map(([n, l]) => (
            <div key={l} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 56 }}>
              <div style={{ color: C.blanco, fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{n}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ color: C.blanco, fontWeight: 700, fontSize: 15 }}>🏟️ USA · México · Canadá 2026</div>
      </div>

      {/* Próximos partidos */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: C.blanco, fontWeight: 800, fontSize: 16 }}>⚽ Próximos partidos</span>
        <button onClick={() => setTab("polla")} style={{ background: "none", border: "none", color: C.naranja, fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Predecir todos →</button>
      </div>

      {PARTIDOS.slice(0, 3).map(p => (
        <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ background: `${C.naranja}20`, color: C.naranja, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{p.fase}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>📅 {p.fecha} · {p.hora}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>{p.bandera_l}</div>
              <div style={{ color: C.blanco, fontWeight: 700, fontSize: 13, marginTop: 4 }}>{p.local}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>VS</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>{p.bandera_v}</div>
              <div style={{ color: C.blanco, fontWeight: 700, fontSize: 13, marginTop: 4 }}>{p.visitante}</div>
            </div>
          </div>
          <button onClick={() => setTab("polla")} style={{ width: "100%", marginTop: 12, padding: "9px", background: `linear-gradient(135deg, ${C.naranja}, #e5622a)`, border: "none", borderRadius: 10, color: C.blanco, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ⚽ Hacer predicción
          </button>
        </div>
      ))}

      {/* Bono diario */}
      <div style={{ background: `linear-gradient(135deg, rgba(236,168,45,0.2), rgba(253,119,81,0.1))`, border: `1px solid rgba(236,168,45,0.4)`, borderRadius: 14, padding: "16px", marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: C.dorado, fontWeight: 800, fontSize: 15 }}>🪙 Bono diario</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 3 }}>Tienes 10 monedas esperándote</div>
        </div>
        <button style={{ background: `linear-gradient(135deg, ${C.dorado}, #c9891a)`, border: "none", borderRadius: 10, color: C.negro, fontWeight: 800, fontSize: 14, padding: "10px 18px", cursor: "pointer" }}>
          ¡Reclamar!
        </button>
      </div>
    </div>
  );
}

function Polla({ monedas }) {
  const [preds, setPreds] = useState({});
  const set = (id, k, v) => setPreds(p => ({ ...p, [id]: { ...p[id], [k]: v } }));

  return (
    <div>
      <div style={{ background: `rgba(64,141,255,0.1)`, border: `1px solid rgba(64,141,255,0.3)`, borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <div style={{ color: C.blanco, fontWeight: 700, fontSize: 13 }}>Tienes 🪙 {monedas} monedas</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Mínimo 10 por partido · Si aciertas ganas el doble</div>
        </div>
      </div>

      {PARTIDOS.map(p => (
        <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ background: `${C.naranja}20`, color: C.naranja, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{p.fase}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>📅 {p.fecha} · {p.hora}</span>
          </div>

          {/* Equipos grandes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36 }}>{p.bandera_l}</div>
              <div style={{ color: C.blanco, fontWeight: 800, fontSize: 14, marginTop: 6 }}>{p.local}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px" }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700 }}>VS</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36 }}>{p.bandera_v}</div>
              <div style={{ color: C.blanco, fontWeight: 800, fontSize: 14, marginTop: 6 }}>{p.visitante}</div>
            </div>
          </div>

          {/* Predicción resultado */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>¿Quién gana?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { val: "local", label: p.local, emoji: p.bandera_l },
                { val: "empate", label: "Empate", emoji: "🤝" },
                { val: "visitante", label: p.visitante, emoji: p.bandera_v },
              ].map(op => (
                <button key={op.val} onClick={() => set(p.id, "resultado", op.val)} style={{
                  padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                  border: preds[p.id]?.resultado === op.val ? `2px solid ${C.naranja}` : "1px solid rgba(255,255,255,0.1)",
                  background: preds[p.id]?.resultado === op.val ? `${C.naranja}20` : "rgba(255,255,255,0.04)",
                  color: preds[p.id]?.resultado === op.val ? C.naranja : "rgba(255,255,255,0.6)",
                  fontWeight: preds[p.id]?.resultado === op.val ? 800 : 400,
                  fontSize: 12, textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{op.emoji}</div>
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Marcador y apuesta */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 6, fontWeight: 700 }}>Marcador exacto</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" min="0" max="20" placeholder="0"
                  value={preds[p.id]?.gl || ""}
                  onChange={e => set(p.id, "gl", e.target.value)}
                  style={{ width: 48, padding: "8px", textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: C.blanco, fontSize: 16, outline: "none" }} />
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, fontWeight: 700 }}>-</span>
                <input type="number" min="0" max="20" placeholder="0"
                  value={preds[p.id]?.gv || ""}
                  onChange={e => set(p.id, "gv", e.target.value)}
                  style={{ width: 48, padding: "8px", textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: C.blanco, fontSize: 16, outline: "none" }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 6, fontWeight: 700 }}>🪙 Apuesta</div>
              <input type="number" min="10" placeholder="10"
                value={preds[p.id]?.apuesta || ""}
                onChange={e => set(p.id, "apuesta", e.target.value)}
                style={{ width: "100%", padding: "8px", textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: C.dorado, fontSize: 15, fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          <button style={{ width: "100%", marginTop: 14, padding: "12px", background: `linear-gradient(135deg, ${C.naranja}, #e5622a)`, border: "none", borderRadius: 12, color: C.blanco, fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 20px ${C.naranja}40` }}>
            ⚽ Confirmar predicción
          </button>
        </div>
      ))}
    </div>
  );
}

function Ranking() {
  const medallas = ["🥇", "🥈", "🥉"];
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.15), rgba(253,119,81,0.1))", border: "1px solid rgba(236,168,45,0.3)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Tu posición actual</div>
        <div style={{ color: C.dorado, fontSize: 36, fontWeight: 900 }}>#4</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>¡Sigue prediciendo para subir!</div>
      </div>

      {RANKING.map((j, i) => (
        <div key={j.pos} style={{
          display: "flex", alignItems: "center", gap: 14,
          background: j.esYo ? `rgba(253,119,81,0.1)` : "rgba(255,255,255,0.04)",
          border: j.esYo ? `2px solid ${C.naranja}` : "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 10,
        }}>
          <div style={{ fontSize: i < 3 ? 28 : 16, fontWeight: 900, color: C.dorado, minWidth: 36, textAlign: "center" }}>
            {i < 3 ? medallas[i] : `#${j.pos}`}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: j.esYo ? C.naranja : C.blanco, fontWeight: 800, fontSize: 15 }}>
              {j.nombre} {j.esYo ? "👈 Tú" : ""}
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
              {j.aciertos} predicciones acertadas
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.dorado, fontWeight: 900, fontSize: 16 }}>🪙 {j.monedas}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Misiones() {
  const lista = [
    { icono: "✅", titulo: "Perfil creado", desc: "Completaste tu registro", monedas: 100, ok: true },
    { icono: "⚽", titulo: "Primera predicción", desc: "Predice tu primer partido", monedas: 50, ok: false },
    { icono: "🤝", titulo: "Invita un amigo", desc: "Refiere un jugador y ganan ambos", monedas: 50, ok: false },
    { icono: "▶️", titulo: "Ver video CLTiene", desc: "Mira un video de la marca", monedas: 30, ok: false },
    { icono: "🧠", titulo: "Trivia del Mundial", desc: "Responde 5 preguntas de fútbol", monedas: 40, ok: false },
    { icono: "🔥", titulo: "7 días seguidos", desc: "Ingresa 7 días consecutivos", monedas: 70, ok: false },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ color: C.blanco, fontWeight: 800, fontSize: 16 }}>Tus misiones</span>
        <span style={{ background: `${C.naranja}20`, color: C.naranja, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>1 / {lista.length} completadas</span>
      </div>

      {lista.map((m, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 14,
          background: m.ok ? "rgba(22,199,132,0.08)" : "rgba(255,255,255,0.04)",
          border: m.ok ? "1px solid rgba(22,199,132,0.3)" : "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 10,
          opacity: m.ok ? 0.8 : 1,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: m.ok ? "rgba(22,199,132,0.15)" : "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {m.icono}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: m.ok ? C.verde : C.blanco, fontWeight: 700, fontSize: 14 }}>{m.titulo}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>{m.desc}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: C.dorado, fontWeight: 900, fontSize: 14 }}>+{m.monedas} 🪙</div>
            {m.ok
              ? <div style={{ color: C.verde, fontSize: 11, marginTop: 3 }}>✓ Listo</div>
              : <button style={{ marginTop: 4, background: `linear-gradient(135deg, ${C.naranja}, #e5622a)`, border: "none", borderRadius: 8, color: C.blanco, fontWeight: 700, fontSize: 12, padding: "5px 12px", cursor: "pointer" }}>Ir →</button>
            }
          </div>
        </div>
      ))}
    </div>
  );
}
