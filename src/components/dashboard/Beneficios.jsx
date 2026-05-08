import { useState } from "react";
import { C } from "./constants";
import client from "../../api/client";
import { getNombreMarca, leerConfigMarca } from "../../utils/marca";

const getCatalogoDefault = (empresa) => [
  {
    id: "descuento_10",
    nombre: `Descuento 10% en servicios ${empresa}`,
    descripcion: `Aplica en cualquier servicio de ${empresa} por 30 días`,
    costo: 300,
    icono: "🏷️",
    categoria: "Descuentos",
  },
  {
    id: "descuento_25",
    nombre: `Descuento 25% en servicios ${empresa}`,
    descripcion: `Aplica en cualquier servicio de ${empresa} por 30 días`,
    costo: 600,
    icono: "🔥",
    categoria: "Descuentos",
  },
  {
    id: "plan_basico",
    nombre: `Plan Básico ${empresa} - 1 mes gratis`,
    descripcion: "Acceso al plan básico sin costo por un mes",
    costo: 1000,
    icono: "⭐",
    categoria: "Planes",
  },
  {
    id: "consultoria",
    nombre: "Consultoría gratuita",
    descripcion: `Sesión de consultoría personalizada con un experto ${empresa}`,
    costo: 1500,
    icono: "💼",
    categoria: "Servicios",
  },
  {
    id: "diagnostico",
    nombre: "Diagnóstico empresarial",
    descripcion: "Análisis completo de tu empresa o emprendimiento",
    costo: 2500,
    icono: "📊",
    categoria: "Servicios",
  },
];

const getBeneficiosEmpresa = () => {
  const config = leerConfigMarca();
  if (config?.beneficios_json) {
    try {
      const arr = JSON.parse(config.beneficios_json);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch { /* fallback */ }
  }
  return null;
};

export default function Beneficios({ usuario, perfil, cargarPerfil }) {
  const bordeSuave = "1px solid var(--input-border)";
  const fondoSuave = "var(--input-bg)";
  const textoSuave = "var(--texto-sec)";
  const textoMuySuave = "var(--texto-ter)";

  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [canjeando, setCanjeando] = useState(null);
  const [modalConfirm, setModalConfirm] = useState(null);
  const [canalContacto, setCanalContacto] = useState("whatsapp");
  const [resultado, setResultado] = useState(null);

  const monedas = perfil?.monedas || 0;
  const elegible = perfil?.elegible_canje || false;
  const empresa = getNombreMarca();
  const CATALOGO = getBeneficiosEmpresa() || getCatalogoDefault(empresa);

  const categoriasDisponibles = ["Todos", ...new Set(CATALOGO.map((b) => b.categoria).filter(Boolean))];
  const filtrados = categoriaActiva === "Todos" ? CATALOGO : CATALOGO.filter((b) => b.categoria === categoriaActiva);

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
      setResultado({ tipo: "exito", mensaje: res.data.mensaje || "Canje registrado correctamente" });
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
      <h2 style={{ color: "var(--texto)", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Beneficios {empresa}</h2>
      <p style={{ color: "var(--texto-ter)", fontSize: 13, marginBottom: 16 }}>Canjea tus monedas por beneficios reales</p>

      <div style={{ background: "linear-gradient(135deg, rgba(253,119,81,0.15), rgba(237,30,40,0.1))", border: "1px solid rgba(253,119,81,0.3)", borderRadius: 14, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--texto-sec)", fontSize: 12 }}>Tu saldo disponible</div>
          <div style={{ color: C.naranja, fontSize: 28, fontWeight: 800 }}>🪙 {monedas}</div>
        </div>
        {!elegible && (
          <div style={{ background: "var(--card)", borderRadius: 10, padding: "8px 12px", maxWidth: 180 }}>
            <div style={{ color: "var(--texto-ter)", fontSize: 10, lineHeight: 1.4 }}>Los canjes se habilitan al finalizar el Mundial. Sigue acumulando monedas.</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {categoriasDisponibles.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              whiteSpace: "nowrap",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              border: categoriaActiva === cat ? `2px solid ${C.naranja}` : bordeSuave,
              background: categoriaActiva === cat ? "rgba(253,119,81,0.2)" : fondoSuave,
              color: categoriaActiva === cat ? C.naranja : textoSuave,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtrados.map((b) => {
          const alcanza = monedas >= b.costo;
          return (
            <div key={b.id} style={{ background: "var(--card)", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--card-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                  <span style={{ fontSize: 32 }}>{b.icono}</span>
                  <div>
                    <div style={{ color: "var(--texto)", fontWeight: 700, fontSize: 14 }}>{b.nombre}</div>
                    <div style={{ color: "var(--texto-ter)", fontSize: 12, marginTop: 2 }}>{b.descripcion}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ color: alcanza ? C.naranja : textoMuySuave, fontWeight: 800, fontSize: 16 }}>🪙 {b.costo}</div>
                  <div style={{ color: alcanza ? "var(--texto-sec)" : "var(--texto-ter)", fontSize: 10 }}>
                    {alcanza ? "Disponible" : `Faltan ${b.costo - monedas}`}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setModalConfirm(b);
                  setResultado(null);
                }}
                disabled={!alcanza || !elegible}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: alcanza && elegible ? "none" : "1px solid var(--input-border)",
                  cursor: alcanza && elegible ? "pointer" : "not-allowed",
                  fontWeight: 700,
                  fontSize: 13,
                  background: alcanza && elegible ? "linear-gradient(135deg, #FD7751, #ED1E28)" : "rgba(253,119,81,0.10)",
                  color: alcanza && elegible ? "#FFFFFF" : "var(--texto-sec)",
                  opacity: alcanza && elegible ? 1 : 1,
                }}
              >
                {!elegible ? "Disponible al finalizar el Mundial" : alcanza ? "Canjear" : "Monedas insuficientes"}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(64,141,255,0.08)", border: "1px solid rgba(64,141,255,0.2)", borderRadius: 12 }}>
        <div style={{ color: "var(--texto-sec)", fontSize: 11, lineHeight: 1.6 }}>
          Para garantizar un juego justo, los beneficios están pensados para jugadores activos. Un asesor de {empresa} se pondrá en contacto contigo para activar tu beneficio.
        </div>
      </div>

      {modalConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setModalConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a1230", borderRadius: 18, padding: 28, maxWidth: 380, width: "100%", border: "1px solid rgba(253,119,81,0.3)" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 48 }}>{modalConfirm.icono}</span>
              <h3 style={{ color: "var(--texto)", fontSize: 18, fontWeight: 800, marginTop: 10 }}>{modalConfirm.nombre}</h3>
              <p style={{ color: "var(--texto-ter)", fontSize: 13, marginTop: 6 }}>{modalConfirm.descripcion}</p>
              <div style={{ color: C.naranja, fontSize: 24, fontWeight: 800, marginTop: 12 }}>🪙 {modalConfirm.costo} monedas</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "var(--texto-sec)", fontSize: 12, marginBottom: 8 }}>¿Cómo prefieres que te contactemos?</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { id: "whatsapp", label: "WhatsApp", icon: "📱" },
                  { id: "email", label: "Email", icon: "📧" },
                  { id: "llamada", label: "Llamada", icon: "📞" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCanalContacto(c.id)}
                    style={{
                      flex: 1,
                      padding: "8px 6px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      border: canalContacto === c.id ? `2px solid ${C.naranja}` : bordeSuave,
                      background: canalContacto === c.id ? "rgba(253,119,81,0.15)" : fondoSuave,
                      color: canalContacto === c.id ? C.naranja : textoSuave,
                    }}
                  >
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
              <button onClick={() => setModalConfirm(null)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid var(--input-border)", background: "none", color: "var(--texto-sec)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleCanjear} disabled={!!canjeando} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FD7751, #ED1E28)", color: "#FFFFFF", fontWeight: 700, fontSize: 13, cursor: canjeando ? "not-allowed" : "pointer", opacity: canjeando ? 0.6 : 1 }}>
                {canjeando ? "Canjeando..." : "Confirmar canje"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
