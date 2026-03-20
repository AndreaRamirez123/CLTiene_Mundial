import { useState } from "react";
import { C } from "./constants";
import client from "../../api/client";

const CATALOGO = [
  {
    id: "descuento_10",
    nombre: "Descuento 10% en servicios CLTiene",
    descripcion: "Aplica en cualquier servicio de CLTiene por 30 dias",
    costo: 200,
    icono: "🏷️",
    categoria: "Descuentos",
  },
  {
    id: "descuento_25",
    nombre: "Descuento 25% en servicios CLTiene",
    descripcion: "Aplica en cualquier servicio de CLTiene por 30 dias",
    costo: 500,
    icono: "🔥",
    categoria: "Descuentos",
  },
  {
    id: "plan_basico",
    nombre: "Plan Basico CLTiene - 1 mes gratis",
    descripcion: "Acceso al plan basico sin costo por un mes",
    costo: 800,
    icono: "⭐",
    categoria: "Planes",
  },
  {
    id: "consultoria",
    nombre: "Consultoria gratuita",
    descripcion: "Sesion de consultoria personalizada con un experto CLTiene",
    costo: 1000,
    icono: "💼",
    categoria: "Servicios",
  },
  {
    id: "diagnostico",
    nombre: "Diagnostico empresarial",
    descripcion: "Analisis completo de tu empresa o emprendimiento",
    costo: 1500,
    icono: "📊",
    categoria: "Servicios",
  },
  {
    id: "premio_top",
    nombre: "Premio exclusivo Top 10",
    descripcion: "Beneficio sorpresa para los mejores jugadores del ranking",
    costo: 2000,
    icono: "🏆",
    categoria: "Exclusivos",
  },
];

const CATEGORIAS = ["Todos", "Descuentos", "Planes", "Servicios", "Exclusivos"];

export default function Beneficios({ usuario, perfil, cargarPerfil }) {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [canjeando, setCanjeando] = useState(null);
  const [modalConfirm, setModalConfirm] = useState(null);
  const [canalContacto, setCanalContacto] = useState("whatsapp");
  const [resultado, setResultado] = useState(null);

  const monedas = perfil?.monedas || 0;
  const elegible = perfil?.elegible_canje || false;

  const filtrados = categoriaActiva === "Todos"
    ? CATALOGO
    : CATALOGO.filter(b => b.categoria === categoriaActiva);

  const handleCanjear = async () => {
    if (!modalConfirm) return;
    setCanjeando(modalConfirm.id);
    try {
      const res = await client.post(`/canjes/${usuario.uid}`, {
        beneficio_id: modalConfirm.id,
        beneficio_nombre: modalConfirm.nombre,
        monedas_costo: modalConfirm.costo,
        categoria: modalConfirm.categoria,
        canal_contacto: canalContacto,
      });
      setResultado({ tipo: "exito", mensaje: res.data.mensaje || "Canje registrado exitosamente" });
      cargarPerfil();
    } catch (err) {
      setResultado({ tipo: "error", mensaje: err.response?.data?.message || "Error al canjear" });
    } finally {
      setCanjeando(null);
      setModalConfirm(null);
    }
  };

  return (
    <div>
      <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Beneficios CLTiene</h2>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 16 }}>
        Canjea tus monedas por beneficios reales
      </p>

      {/* Saldo */}
      <div style={{ background: "linear-gradient(135deg, rgba(253,119,81,0.15), rgba(237,30,40,0.1))", border: "1px solid rgba(253,119,81,0.3)", borderRadius: 14, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Tu saldo disponible</div>
          <div style={{ color: C.naranja, fontSize: 28, fontWeight: 800 }}>🪙 {monedas}</div>
        </div>
        {!elegible && (
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 12px", maxWidth: 180 }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, lineHeight: 1.4 }}>
              Los canjes se habilitan al finalizar el Mundial. Sigue acumulando monedas.
            </div>
          </div>
        )}
      </div>

      {/* Filtro categorias */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            style={{
              padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", fontSize: 11, fontWeight: 700,
              border: categoriaActiva === cat ? `2px solid ${C.naranja}` : "1px solid rgba(255,255,255,0.1)",
              background: categoriaActiva === cat ? "rgba(253,119,81,0.2)" : "rgba(255,255,255,0.04)",
              color: categoriaActiva === cat ? C.naranja : "rgba(255,255,255,0.5)",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalogo */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtrados.map(b => {
          const alcanza = monedas >= b.costo;
          return (
            <div key={b.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                  <span style={{ fontSize: 32 }}>{b.icono}</span>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{b.nombre}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{b.descripcion}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ color: alcanza ? C.naranja : "rgba(255,255,255,0.3)", fontWeight: 800, fontSize: 16 }}>
                    🪙 {b.costo}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                    {alcanza ? "Disponible" : `Faltan ${b.costo - monedas}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setModalConfirm(b); setResultado(null); }}
                disabled={!alcanza || !elegible}
                style={{
                  width: "100%", marginTop: 12, padding: "10px 0", borderRadius: 10, border: "none", cursor: alcanza && elegible ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13,
                  background: alcanza && elegible ? "linear-gradient(135deg, #FD7751, #ED1E28)" : "rgba(255,255,255,0.06)",
                  color: alcanza && elegible ? "#fff" : "rgba(255,255,255,0.2)",
                  opacity: alcanza && elegible ? 1 : 0.6,
                }}
              >
                {!elegible ? "Disponible al finalizar el Mundial" : alcanza ? "Canjear" : "Monedas insuficientes"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info legal */}
      <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(64,141,255,0.08)", border: "1px solid rgba(64,141,255,0.2)", borderRadius: 12 }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.6 }}>
          Para garantizar un juego justo, los beneficios estan pensados para jugadores activos.
          Un asesor CLTiene se pondra en contacto contigo para activar tu beneficio.
        </div>
      </div>

      {/* Modal confirmacion */}
      {modalConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setModalConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1a1230", borderRadius: 18, padding: 28, maxWidth: 380, width: "100%", border: "1px solid rgba(253,119,81,0.3)" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 48 }}>{modalConfirm.icono}</span>
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginTop: 10 }}>{modalConfirm.nombre}</h3>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 6 }}>{modalConfirm.descripcion}</p>
              <div style={{ color: C.naranja, fontSize: 24, fontWeight: 800, marginTop: 12 }}>🪙 {modalConfirm.costo} monedas</div>
            </div>

            {/* Canal de contacto */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 }}>¿Como prefieres que te contactemos?</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { id: "whatsapp", label: "WhatsApp", icon: "📱" },
                  { id: "email", label: "Email", icon: "📧" },
                  { id: "llamada", label: "Llamada", icon: "📞" },
                ].map(c => (
                  <button key={c.id} onClick={() => setCanalContacto(c.id)} style={{
                    flex: 1, padding: "8px 6px", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: 600,
                    border: canalContacto === c.id ? `2px solid ${C.naranja}` : "1px solid rgba(255,255,255,0.1)",
                    background: canalContacto === c.id ? "rgba(253,119,81,0.15)" : "rgba(255,255,255,0.04)",
                    color: canalContacto === c.id ? C.naranja : "rgba(255,255,255,0.4)",
                  }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {resultado && (
              <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 12, background: resultado.tipo === "exito" ? "rgba(22,199,132,0.15)" : "rgba(237,30,40,0.15)", color: resultado.tipo === "exito" ? "#16C784" : "#ED1E28", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                {resultado.mensaje}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModalConfirm(null)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleCanjear} disabled={!!canjeando} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FD7751, #ED1E28)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: canjeando ? "not-allowed" : "pointer", opacity: canjeando ? 0.6 : 1 }}>
                {canjeando ? "Canjeando..." : "Confirmar canje"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
