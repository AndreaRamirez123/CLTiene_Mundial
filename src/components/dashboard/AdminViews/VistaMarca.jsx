import { useEffect, useRef, useState } from "react";
import { C } from "../constants";
import { aplicarConfigMarca, guardarConfigMarca } from "../../../utils/marca";

export default function VistaMarca({ client, usuario }) {
  const esSuperadmin = usuario?.rol === "superadmin";
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [form, setForm] = useState({
    nombre_app: "",
    subtitulo: "",
    logo_url: "",
    color_primario: "#FD7751",
    color_secundario: "#ED1E28",
    color_acento: "#ECA82D",
    color_fondo: "#0f0a1e",
    publicidad_json: "",
    beneficios_json: "",
    terminos_condiciones: "",
    politica_privacidad: "",
    videos_json: "",
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Cargar lista de empresas (superadmin) o config directa (admin)
  useEffect(() => {
    if (esSuperadmin) {
      client
        .get("/admin/empresas")
        .then((res) => {
          const lista = res?.data || [];
          setEmpresas(lista);
          if (lista.length > 0) setEmpresaSeleccionada(lista[0].id);
        })
        .catch(() => {})
        .finally(() => setCargando(false));
    } else {
      // Admin de empresa: cargar su propia config
      cargarConfig();
    }
  }, [client]);

  // Cuando cambia la empresa seleccionada, cargar su config
  const formLimpio = {
    nombre_app: "",
    subtitulo: "",
    logo_url: "",
    color_primario: "#FD7751",
    color_secundario: "#ED1E28",
    color_acento: "#ECA82D",
    color_fondo: "#0f0a1e",
    publicidad_json: "",
    beneficios_json: "",
    terminos_condiciones: "",
    politica_privacidad: "",
    videos_json: "",
  };

  useEffect(() => {
    if (esSuperadmin && empresaSeleccionada) {
      cargarConfigEmpresa(empresaSeleccionada);
    }
  }, [empresaSeleccionada]);

  const cargarConfig = () => {
    setCargando(true);
    client
      .get("/config-marca")
      .then((res) => {
        if (res?.data) {
          setForm({ ...formLimpio, ...res.data });
          if (!esSuperadmin) aplicarConfigMarca(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  };

  const cargarConfigEmpresa = (empresaId) => {
    setCargando(true);
    client
      .get(`/admin/empresas/${empresaId}`)
      .then((res) => {
        const config = res?.data?.configMarca;
        setForm({ ...formLimpio, ...config });
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const guardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      const payload = {
        nombre_app: form.nombre_app,
        subtitulo: form.subtitulo,
        logo_url: form.logo_url,
        color_primario: form.color_primario,
        color_secundario: form.color_secundario,
        color_acento: form.color_acento,
        color_fondo: form.color_fondo,
        publicidad_json: form.publicidad_json,
        beneficios_json: form.beneficios_json,
        terminos_condiciones: form.terminos_condiciones,
        politica_privacidad: form.politica_privacidad,
        videos_json: form.videos_json,
        ...(esSuperadmin && empresaSeleccionada ? { empresa_id: empresaSeleccionada } : {}),
      };
      const res = await client.put("/admin/config-marca", payload);
      const data = res?.data || form;
      setForm((f) => ({ ...f, ...data }));
      // Refrescar config local si el usuario es admin O si el superadmin
      // está editando su propia empresa (para ver los cambios sin recargar)
      const editandoMiEmpresa =
        !esSuperadmin ||
        !empresaSeleccionada ||
        empresaSeleccionada === usuario?.empresa_id;
      if (editandoMiEmpresa) guardarConfigMarca(data);
      setMensaje({ tipo: "exito", texto: "Marca actualizada correctamente" });
      alert("Cambios guardados correctamente");
    } catch (e) {
      setMensaje({ tipo: "error", texto: "No se pudo actualizar" });
      alert("Error: No se pudieron guardar los cambios");
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  };

  if (cargando && empresas.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ color: C.naranja, fontSize: 16 }}>Cargando configuracion...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Selector de empresa (solo superadmin) */}
      {esSuperadmin && empresas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 700 }}>
              Seleccionar empresa
            </span>
            <select
              value={empresaSeleccionada || ""}
              onChange={(e) => setEmpresaSeleccionada(Number(e.target.value))}
              style={{
                padding: "11px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.06)",
                color: "var(--texto)",
                outline: "none",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id} style={{ background: "#1a1a2e", color: "#fff" }}>
                  {emp.nombre} ({emp.slug})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, padding: "24px 16px", boxShadow: "0 12px 40px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ color: "var(--texto)", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            🎨 Configuracion de Marca
          </h2>
          <p style={{ color: "var(--texto-sec)", fontSize: 13 }}>
            Cambia logo, nombre y colores 
            {esSuperadmin && empresaSeleccionada && (
              <span style={{ color: C.naranja, fontWeight: 600 }}>
                {" "}— Editando: {empresas.find((e) => e.id === empresaSeleccionada)?.nombre}
              </span>
            )}
          </p>
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: 20, color: "var(--texto-sec)" }}>Cargando config...</div>
        ) : (
          <>
            {mensaje && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: mensaje.tipo === "exito" ? "rgba(22,199,132,0.15)" : "rgba(237,30,40,0.15)",
                  color: mensaje.tipo === "exito" ? "#16C784" : "#ED1E28",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {mensaje.texto}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <Campo
                label="Nombre de la app"
                value={form.nombre_app}
                placeholder="CLTiene Mundial"
                onChange={(v) => set("nombre_app", v)}
              />
              <Campo
                label="Subtitulo"
                value={form.subtitulo}
                placeholder="Mundial 2026"
                onChange={(v) => set("subtitulo", v)}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <span style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Logo</span>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 12,
                  background: "rgba(255,255,255,0.06)", border: "1px solid var(--card-border)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {form.logo_url ? (
                    <img
                      src={form.logo_url.startsWith("http") ? form.logo_url : `${import.meta.env.VITE_API_BASE_URL || ''}${form.logo_url}`}
                      alt="logo"
                      style={{ maxHeight: 60, maxWidth: 60, objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ color: "var(--texto-ter)", fontSize: 11 }}>Sin logo</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: "rgba(255,255,255,0.08)", color: "var(--texto)",
                    fontWeight: 600, fontSize: 13, cursor: "pointer", textAlign: "center",
                  }}>
                    Seleccionar archivo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          alert("El archivo no debe superar 2MB");
                          return;
                        }
                        const formData = new FormData();
                        formData.append("logo", file);
                        if (esSuperadmin && empresaSeleccionada) {
                          formData.append("empresa_id", empresaSeleccionada);
                        }
                        try {
                          const res = await client.post("/admin/config-marca/upload-logo", formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                          });
                          set("logo_url", res.data.logo_url);
                        } catch {
                          alert("Error al subir la imagen");
                        }
                      }}
                    />
                  </label>
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => set("logo_url", "")}
                      style={{
                        padding: "6px 12px", borderRadius: 8, border: "none",
                        background: "rgba(231,76,60,0.15)", color: "#e74c3c",
                        fontSize: 12, cursor: "pointer", fontWeight: 600,
                      }}
                    >
                      Quitar logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <div style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Paleta</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                <ColorField label="Primario" value={form.color_primario} onChange={(v) => set("color_primario", v)} />
                <ColorField label="Secundario" value={form.color_secundario} onChange={(v) => set("color_secundario", v)} />
                <ColorField label="Acento" value={form.color_acento} onChange={(v) => set("color_acento", v)} />
                <ColorField label="Fondo" value={form.color_fondo} onChange={(v) => set("color_fondo", v)} />
              </div>
            </div>

            {/* Textos legales */}
            <div style={{ marginTop: 22 }}>
              <div style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Textos Legales</div>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Terminos y Condiciones
                  </label>
                  <textarea
                    value={form.terminos_condiciones || ""}
                    onChange={(e) => set("terminos_condiciones", e.target.value)}
                    placeholder="Escribe aqui los terminos y condiciones de tu empresa..."
                    rows={6}
                    style={{
                      width: "100%", padding: "11px 12px", borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)",
                      color: "var(--texto)", outline: "none", fontSize: 13, resize: "vertical",
                      fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Politica de Privacidad
                  </label>
                  <textarea
                    value={form.politica_privacidad || ""}
                    onChange={(e) => set("politica_privacidad", e.target.value)}
                    placeholder="Escribe aqui la politica de privacidad de tu empresa..."
                    rows={6}
                    style={{
                      width: "100%", padding: "11px 12px", borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)",
                      color: "var(--texto)", outline: "none", fontSize: 13, resize: "vertical",
                      fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Videos de la marca (misión "Video del día") */}
            <EditorVideos
              key={`vid-${empresaSeleccionada || "default"}`}
              value={form.videos_json}
              onChange={(json) => set("videos_json", json)}
              client={client}
              esSuperadmin={esSuperadmin}
              empresaSeleccionada={empresaSeleccionada}
            />

            {/* Publicidad / Carrusel */}
            <EditorCarrusel
              key={empresaSeleccionada || "default"}
              value={form.publicidad_json}
              onChange={(json) => set("publicidad_json", json)}
            />

            {/* Beneficios */}
            <EditorBeneficios
              key={`ben-${empresaSeleccionada || "default"}`}
              value={form.beneficios_json}
              onChange={(json) => set("beneficios_json", json)}
            />

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={guardar}
                disabled={guardando}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: guardando ? "not-allowed" : "pointer",
                  opacity: guardando ? 0.6 : 1,
                  boxShadow: "0 8px 22px rgba(var(--brand-primary-rgb), 0.3)",
                }}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Campo({ label, value, placeholder, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 600 }}>{label}</span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "11px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.06)",
          color: "var(--texto)",
          outline: "none",
        }}
      />
    </label>
  );
}

// --- Helpers para colores ---
const rgbaToHex = (rgba) => {
  if (!rgba) return "#000000";
  if (rgba.startsWith("#")) return rgba;
  const nums = rgba.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return "#000000";
  const r = parseInt(nums[0]).toString(16).padStart(2, "0");
  const g = parseInt(nums[1]).toString(16).padStart(2, "0");
  const b = parseInt(nums[2]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// --- Presets de gradientes ---
const GRADIENT_PRESETS = [
  { nombre: "Azul-Verde", valor: "linear-gradient(135deg, rgba(64,141,255,0.2), rgba(22,199,132,0.14))" },
  { nombre: "Naranja", valor: "linear-gradient(135deg, rgba(253,119,81,0.2), rgba(236,168,45,0.14))" },
  { nombre: "Morado", valor: "linear-gradient(135deg, rgba(123,44,191,0.2), rgba(90,24,154,0.14))" },
  { nombre: "Rojo", valor: "linear-gradient(135deg, rgba(237,30,40,0.2), rgba(253,119,81,0.14))" },
  { nombre: "Cyan", valor: "linear-gradient(135deg, rgba(0,188,212,0.2), rgba(64,141,255,0.14))" },
  { nombre: "Rosa", valor: "linear-gradient(135deg, rgba(233,30,99,0.2), rgba(156,39,176,0.14))" },
  { nombre: "Verde", valor: "linear-gradient(135deg, rgba(22,199,132,0.2), rgba(76,175,80,0.14))" },
  { nombre: "Dorado", valor: "linear-gradient(135deg, rgba(236,168,45,0.2), rgba(255,193,7,0.14))" },
];

const BUTTON_PRESETS = [
  { nombre: "Azul-Verde", valor: "linear-gradient(135deg, #408DFF, #16C784)" },
  { nombre: "Naranja", valor: "linear-gradient(135deg, #FD7751, #ECA82D)" },
  { nombre: "Morado", valor: "linear-gradient(135deg, #7B2CBF, #5A189A)" },
  { nombre: "Rojo", valor: "linear-gradient(135deg, #ED1E28, #FD7751)" },
  { nombre: "Cyan", valor: "linear-gradient(135deg, #00BCD4, #408DFF)" },
  { nombre: "Rosa", valor: "linear-gradient(135deg, #E91E63, #9C27B0)" },
  { nombre: "Verde", valor: "linear-gradient(135deg, #16C784, #4CAF50)" },
  { nombre: "Dorado", valor: "linear-gradient(135deg, #ECA82D, #FFC107)" },
];

// --- Emojis organizados por categoria ---
const EMOJI_CATEGORIAS = [
  { label: "Salud", emojis: ["🩺", "💊", "🏥", "❤️", "🧑‍⚕️", "🩹", "💉", "🦷", "👁️", "🧬"] },
  { label: "Vehiculos", emojis: ["🚗", "🏍️", "🚕", "🚙", "🛞", "🔧", "⛽", "🅿️", "🚨", "🛣️"] },
  { label: "Agua", emojis: ["💧", "🚿", "🌊", "🪠", "🧊", "💦", "🌧️", "☔", "🏗️", "🔩"] },
  { label: "Hogar", emojis: ["🏠", "🔑", "💡", "🔌", "🧹", "🛠️", "🧰", "🪛", "🏢", "🪜"] },
  { label: "Dinero", emojis: ["💰", "💳", "💵", "🏦", "📈", "💎", "🪙", "💲", "🧾", "📊"] },
  { label: "Educacion", emojis: ["🎓", "📚", "✏️", "💻", "🧠", "📝", "🔬", "🎒", "📖", "🏫"] },
  { label: "Servicios", emojis: ["📱", "📦", "🛡️", "⚡", "📡", "☁️", "🔒", "🌐", "📞", "✉️"] },
  { label: "Viajes", emojis: ["✈️", "🌍", "🏖️", "🗺️", "🧳", "🏔️", "🚀", "🎯", "⛵", "🚂"] },
  { label: "Otros", emojis: ["🎁", "🏆", "⭐", "🌟", "🔔", "🤝", "🎉", "🔥", "👍", "📢"] },
];

function EmojiPicker({ value, onChange, compact }) {
  const [abierto, setAbierto] = useState(false);
  const [cat, setCat] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const abrir = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const alturaPopup = 320;
      const cabeAbajo = rect.bottom + alturaPopup < window.innerHeight;
      setPos({
        top: cabeAbajo ? rect.bottom + 4 : rect.top - alturaPopup - 4,
        left: Math.min(rect.left, window.innerWidth - 296),
      });
    }
    setAbierto(!abierto);
  };

  return (
    <div style={{ display: "inline-block" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={abrir}
        style={{
          width: compact ? 40 : 48, height: compact ? 40 : 48, borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
          fontSize: compact ? 18 : 22, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: "var(--texto)",
        }}
      >
        {value || <span style={{ color: "var(--texto-ter)", fontSize: 11 }}>+</span>}
      </button>
      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position: "fixed", inset: 0, zIndex: 999 }} />
          <div style={{
            position: "fixed", top: pos.top, left: pos.left, zIndex: 1000,
            background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14,
            padding: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.6)", width: 280,
          }}>
            {/* Tabs de categorias */}
            <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
              {EMOJI_CATEGORIAS.map((c, i) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setCat(i)}
                  style={{
                    padding: "3px 8px", borderRadius: 6, border: "none",
                    background: cat === i ? "rgba(255,255,255,0.18)" : "transparent",
                    color: cat === i ? "#fff" : "rgba(255,255,255,0.5)",
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {/* Grid de emojis */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
              {EMOJI_CATEGORIAS[cat].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { onChange(emoji); setAbierto(false); }}
                  style={{
                    width: 44, height: 44, borderRadius: 10, border: value === emoji ? "2px solid rgba(255,255,255,0.5)" : "2px solid transparent",
                    background: value === emoji ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                    fontSize: 22, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = value === emoji ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setAbierto(false); }}
                style={{
                  width: "100%", padding: "6px 0", borderRadius: 8, border: "none",
                  background: "rgba(231,76,60,0.15)", color: "#e74c3c",
                  fontSize: 11, cursor: "pointer", fontWeight: 600, marginTop: 8,
                }}
              >
                Quitar icono
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const SLIDE_VACIO = {
  eyebrow: "",
  titulo: "",
  descripcion: "",
  items: [],
  cta: "Conocer mas",
  url: "",
  heroIcon: "",
  gradient: "linear-gradient(135deg, rgba(64,141,255,0.2), rgba(22,199,132,0.14))",
  border: "rgba(64,141,255,0.32)",
  accent: "#7BC6FF",
  button: "linear-gradient(135deg, #408DFF, #16C784)",
};

function parsearSlides(json) {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function EditorCarrusel({ value, onChange }) {
  const [slides, setSlides] = useState(() => parsearSlides(value));
  const [abierto, setAbierto] = useState(null);

  const sincronizar = (nuevoSlides) => {
    setSlides(nuevoSlides);
    onChange(nuevoSlides.length > 0 ? JSON.stringify(nuevoSlides) : "");
  };

  const agregar = () => {
    const nuevo = [...slides, { ...SLIDE_VACIO }];
    sincronizar(nuevo);
    setAbierto(nuevo.length - 1);
  };

  const eliminar = (idx) => {
    sincronizar(slides.filter((_, i) => i !== idx));
    setAbierto(null);
  };

  const actualizar = (idx, campo, valor) => {
    const copia = slides.map((s, i) => (i === idx ? { ...s, [campo]: valor } : s));
    sincronizar(copia);
  };

  const agregarItem = (idx) => {
    const items = [...(slides[idx].items || []), { icono: "", texto: "" }];
    actualizar(idx, "items", items);
  };

  const actualizarItem = (slideIdx, itemIdx, campo, valor) => {
    const items = (slides[slideIdx].items || []).map((it, i) =>
      i === itemIdx ? { ...it, [campo]: valor } : it
    );
    actualizar(slideIdx, "items", items);
  };

  const eliminarItem = (slideIdx, itemIdx) => {
    const items = (slides[slideIdx].items || []).filter((_, i) => i !== itemIdx);
    actualizar(slideIdx, "items", items);
  };

  const inputStyle = {
    padding: "9px 10px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)",
    color: "var(--texto)", outline: "none", fontSize: 13, width: "100%", boxSizing: "border-box",
  };

  const labelStyle = { color: "var(--texto-sec)", fontSize: 11, fontWeight: 600, marginBottom: 4, display: "block" };

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 700 }}>Publicidad (Carrusel)</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 11 }}>
            {slides.length === 0 ? "Sin slides. Agrega uno para mostrar el carrusel." : `${slides.length} slide${slides.length > 1 ? "s" : ""}`}
          </div>
        </div>
        <button
          type="button"
          onClick={agregar}
          style={{
            padding: "8px 14px", borderRadius: 10, border: "none",
            background: "rgba(22,199,132,0.15)", color: "#16C784",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}
        >
          + Agregar slide
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid var(--card-border)", borderRadius: 14,
              background: "rgba(255,255,255,0.03)", overflow: "hidden",
            }}
          >
            {/* Header del slide (siempre visible) */}
            <div
              onClick={() => setAbierto(abierto === idx ? null : idx)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", cursor: "pointer", userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{slide.heroIcon || "📢"}</span>
                <span style={{ color: "var(--texto)", fontSize: 13, fontWeight: 700 }}>
                  {slide.titulo || `Slide ${idx + 1}`}
                </span>
                {slide.eyebrow && (
                  <span style={{ color: "var(--texto-ter)", fontSize: 11 }}>— {slide.eyebrow}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); eliminar(idx); }}
                  style={{
                    padding: "4px 10px", borderRadius: 8, border: "none",
                    background: "rgba(231,76,60,0.15)", color: "#e74c3c",
                    fontSize: 11, cursor: "pointer", fontWeight: 600,
                  }}
                >
                  Eliminar
                </button>
                <span style={{ color: "var(--texto-ter)", fontSize: 14, transition: "transform 0.2s", transform: abierto === idx ? "rotate(180deg)" : "rotate(0)" }}>
                  ▼
                </span>
              </div>
            </div>

            {/* Contenido expandible */}
            {abierto === idx && (
              <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Fila 1: Eyebrow + Titulo */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                  <div>
                    <span style={labelStyle}>Etiqueta superior</span>
                    <input style={inputStyle} value={slide.eyebrow || ""} placeholder="PLAN SALUD" onChange={(e) => actualizar(idx, "eyebrow", e.target.value)} />
                  </div>
                  <div>
                    <span style={labelStyle}>Titulo</span>
                    <input style={inputStyle} value={slide.titulo || ""} placeholder="Salud al instante" onChange={(e) => actualizar(idx, "titulo", e.target.value)} />
                  </div>
                </div>

                {/* Descripcion */}
                <div>
                  <span style={labelStyle}>Descripcion</span>
                  <textarea
                    style={{ ...inputStyle, resize: "vertical", minHeight: 50, fontFamily: "inherit" }}
                    value={slide.descripcion || ""}
                    placeholder="Texto descriptivo corto..."
                    rows={2}
                    onChange={(e) => actualizar(idx, "descripcion", e.target.value)}
                  />
                </div>

                {/* Icono principal */}
                <div>
                  <span style={labelStyle}>Icono del slide</span>
                  <EmojiPicker value={slide.heroIcon || ""} onChange={(v) => actualizar(idx, "heroIcon", v)} />
                </div>

                {/* Texto boton + URL */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                  <div>
                    <span style={labelStyle}>Texto del boton</span>
                    <input style={inputStyle} value={slide.cta || ""} placeholder="Ver plan" onChange={(e) => actualizar(idx, "cta", e.target.value)} />
                  </div>
                  <div>
                    <span style={labelStyle}>URL del boton</span>
                    <input style={inputStyle} value={slide.url || ""} placeholder="https://tuweb.com" onChange={(e) => actualizar(idx, "url", e.target.value)} />
                  </div>
                </div>

                {/* Items (iconos + texto) */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>Items destacados</span>
                    <button
                      type="button"
                      onClick={() => agregarItem(idx)}
                      style={{
                        padding: "4px 10px", borderRadius: 8, border: "none",
                        background: "rgba(255,255,255,0.08)", color: "var(--texto-sec)",
                        fontSize: 11, cursor: "pointer", fontWeight: 600,
                      }}
                    >
                      + Item
                    </button>
                  </div>
                  {(slide.items || []).map((item, iIdx) => (
                    <div key={iIdx} style={{
                      marginBottom: 10, padding: 10, borderRadius: 10,
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ flexShrink: 0 }}>
                          <EmojiPicker compact value={item.icono || ""} onChange={(v) => actualizarItem(idx, iIdx, "icono", v)} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            style={{ ...inputStyle, marginBottom: 6 }}
                            value={item.texto || ""}
                            placeholder="Titulo del item (ej: Grua y asistencia)"
                            onChange={(e) => actualizarItem(idx, iIdx, "texto", e.target.value)}
                          />
                          <input
                            style={{ ...inputStyle, fontSize: 12 }}
                            value={item.descripcion || ""}
                            placeholder="Descripcion breve (opcional)"
                            onChange={(e) => actualizarItem(idx, iIdx, "descripcion", e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarItem(idx, iIdx)}
                          style={{
                            padding: "6px 8px", borderRadius: 8, border: "none",
                            background: "rgba(231,76,60,0.12)", color: "#e74c3c",
                            fontSize: 12, cursor: "pointer", flexShrink: 0, marginTop: 2,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Colores / estilos */}
                <details style={{ cursor: "pointer" }}>
                  <summary style={{ color: "var(--texto-ter)", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                    Estilos avanzados (colores, gradientes)
                  </summary>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
                    {/* Colores con picker */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <span style={labelStyle}>Color acento</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="color"
                            value={slide.accent || "#7BC6FF"}
                            onChange={(e) => actualizar(idx, "accent", e.target.value)}
                            style={{ width: 36, height: 36, border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
                          />
                          <input style={{ ...inputStyle, flex: 1 }} value={slide.accent || ""} placeholder="#7BC6FF" onChange={(e) => actualizar(idx, "accent", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <span style={labelStyle}>Color borde</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="color"
                            value={rgbaToHex(slide.border) || "#408DFF"}
                            onChange={(e) => actualizar(idx, "border", hexToRgba(e.target.value, 0.32))}
                            style={{ width: 36, height: 36, border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
                          />
                          <input style={{ ...inputStyle, flex: 1 }} value={slide.border || ""} placeholder="rgba(64,141,255,0.32)" onChange={(e) => actualizar(idx, "border", e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Gradiente fondo - presets */}
                    <div>
                      <span style={labelStyle}>Gradiente fondo</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                        {GRADIENT_PRESETS.map((p) => (
                          <button
                            key={p.nombre}
                            type="button"
                            title={p.nombre}
                            onClick={() => actualizar(idx, "gradient", p.valor)}
                            style={{
                              width: 36, height: 36, borderRadius: 10, border: slide.gradient === p.valor ? "2px solid #fff" : "2px solid transparent",
                              background: p.valor, cursor: "pointer", transition: "border 0.2s",
                            }}
                          />
                        ))}
                      </div>
                      <input style={inputStyle} value={slide.gradient || ""} placeholder="linear-gradient(135deg, ...)" onChange={(e) => actualizar(idx, "gradient", e.target.value)} />
                    </div>

                    {/* Gradiente boton - presets */}
                    <div>
                      <span style={labelStyle}>Gradiente boton</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                        {BUTTON_PRESETS.map((p) => (
                          <button
                            key={p.nombre}
                            type="button"
                            title={p.nombre}
                            onClick={() => actualizar(idx, "button", p.valor)}
                            style={{
                              width: 36, height: 36, borderRadius: 10, border: slide.button === p.valor ? "2px solid #fff" : "2px solid transparent",
                              background: p.valor, cursor: "pointer", transition: "border 0.2s",
                            }}
                          />
                        ))}
                      </div>
                      <input style={inputStyle} value={slide.button || ""} placeholder="linear-gradient(135deg, ...)" onChange={(e) => actualizar(idx, "button", e.target.value)} />
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const CATEGORIAS_BENEFICIO = ["Descuentos", "Planes", "Servicios", "Exclusivos"];

const BENEFICIO_VACIO = {
  id: "",
  nombre: "",
  descripcion: "",
  costo: 200,
  icono: "🏷️",
  categoria: "Descuentos",
};

function EditorBeneficios({ value, onChange }) {
  const [beneficios, setBeneficios] = useState(() => {
    try { const arr = JSON.parse(value); return Array.isArray(arr) ? arr : []; }
    catch { return []; }
  });
  const [abierto, setAbierto] = useState(null);

  const sincronizar = (nuevos) => {
    setBeneficios(nuevos);
    onChange(nuevos.length > 0 ? JSON.stringify(nuevos) : "");
  };

  const agregar = () => {
    const id = `beneficio_${Date.now()}`;
    const nuevo = [...beneficios, { ...BENEFICIO_VACIO, id }];
    sincronizar(nuevo);
    setAbierto(nuevo.length - 1);
  };

  const eliminar = (idx) => {
    sincronizar(beneficios.filter((_, i) => i !== idx));
    setAbierto(null);
  };

  const actualizar = (idx, campo, valor) => {
    const copia = beneficios.map((b, i) => (i === idx ? { ...b, [campo]: valor } : b));
    sincronizar(copia);
  };

  const inputStyle = {
    padding: "9px 10px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)",
    color: "var(--texto)", outline: "none", fontSize: 13, width: "100%", boxSizing: "border-box",
  };

  const labelStyle = { color: "var(--texto-sec)", fontSize: 11, fontWeight: 600, marginBottom: 4, display: "block" };

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 700 }}>Beneficios (Catalogo de canjes)</div>
          <div style={{ color: "var(--texto-ter)", fontSize: 11 }}>
            {beneficios.length === 0 ? "Sin beneficios. Se usara el catalogo por defecto." : `${beneficios.length} beneficio${beneficios.length > 1 ? "s" : ""}`}
          </div>
        </div>
        <button
          type="button"
          onClick={agregar}
          style={{
            padding: "8px 14px", borderRadius: 10, border: "none",
            background: "rgba(22,199,132,0.15)", color: "#16C784",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}
        >
          + Agregar beneficio
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {beneficios.map((ben, idx) => (
          <div
            key={ben.id || idx}
            style={{
              border: "1px solid var(--card-border)", borderRadius: 14,
              background: "rgba(255,255,255,0.03)", overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              onClick={() => setAbierto(abierto === idx ? null : idx)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", cursor: "pointer", userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{ben.icono || "🎁"}</span>
                <div>
                  <span style={{ color: "var(--texto)", fontSize: 13, fontWeight: 700 }}>
                    {ben.nombre || `Beneficio ${idx + 1}`}
                  </span>
                  <span style={{ color: "var(--texto-ter)", fontSize: 11, marginLeft: 8 }}>
                    🪙 {ben.costo || 0} — {ben.categoria || "Sin categoria"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); eliminar(idx); }}
                  style={{
                    padding: "4px 10px", borderRadius: 8, border: "none",
                    background: "rgba(231,76,60,0.15)", color: "#e74c3c",
                    fontSize: 11, cursor: "pointer", fontWeight: 600,
                  }}
                >
                  Eliminar
                </button>
                <span style={{ color: "var(--texto-ter)", fontSize: 14, transition: "transform 0.2s", transform: abierto === idx ? "rotate(180deg)" : "rotate(0)" }}>
                  ▼
                </span>
              </div>
            </div>

            {/* Contenido */}
            {abierto === idx && (
              <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Icono */}
                <div>
                  <span style={labelStyle}>Icono</span>
                  <EmojiPicker value={ben.icono || ""} onChange={(v) => actualizar(idx, "icono", v)} />
                </div>

                {/* Nombre */}
                <div>
                  <span style={labelStyle}>Nombre del beneficio</span>
                  <input style={inputStyle} value={ben.nombre || ""} placeholder="Descuento 10% en servicios" onChange={(e) => actualizar(idx, "nombre", e.target.value)} />
                </div>

                {/* Descripcion */}
                <div>
                  <span style={labelStyle}>Descripcion</span>
                  <textarea
                    style={{ ...inputStyle, resize: "vertical", minHeight: 50, fontFamily: "inherit" }}
                    value={ben.descripcion || ""}
                    placeholder="Aplica en cualquier servicio por 30 dias..."
                    rows={2}
                    onChange={(e) => actualizar(idx, "descripcion", e.target.value)}
                  />
                </div>

                {/* Costo + Categoria */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <span style={labelStyle}>Costo en monedas</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      style={inputStyle}
                      value={ben.costo || 0}
                      onChange={(e) => actualizar(idx, "costo", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <span style={labelStyle}>Categoria</span>
                    <select
                      value={ben.categoria || "Descuentos"}
                      onChange={(e) => actualizar(idx, "categoria", e.target.value)}
                      style={{
                        ...inputStyle, cursor: "pointer", appearance: "auto",
                      }}
                    >
                      {CATEGORIAS_BENEFICIO.map((cat) => (
                        <option key={cat} value={cat} style={{ background: "#1a1a2e", color: "#fff" }}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorVideos({ value, onChange, client, esSuperadmin, empresaSeleccionada }) {
  const [videos, setVideos] = useState(() => {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  const [subiendo, setSubiendo] = useState(false);

  const sincronizar = (nuevos) => {
    setVideos(nuevos);
    onChange(nuevos.length > 0 ? JSON.stringify(nuevos) : "");
  };

  const subirVideo = async (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("El video no debe superar 50 MB");
      return;
    }
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      if (esSuperadmin && empresaSeleccionada) {
        formData.append("empresa_id", empresaSeleccionada);
      }
      const res = await client.post("/admin/config-marca/upload-video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const nuevo = {
        id: `video_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
        url: res.data.video_url,
        nombre: file.name,
      };
      sincronizar([...videos, nuevo]);
    } catch (err) {
      alert(err.response?.data?.message || "Error al subir el video");
    } finally {
      setSubiendo(false);
    }
  };

  const eliminar = (idx) => {
    sincronizar(videos.filter((_, i) => i !== idx));
  };

  const resolverUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads")) return `${import.meta.env.VITE_API_BASE_URL || ""}${url}`;
    return url;
  };

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 700 }}>
            Videos de la marca (misión "Video del día")
          </div>
          <div style={{ color: "var(--texto-ter)", fontSize: 11 }}>
            {videos.length === 0
              ? "Sin videos. Agrega uno para activar la misión."
              : `${videos.length} video${videos.length > 1 ? "s" : ""} — rotan diariamente`}
          </div>
        </div>
        <label style={{
          padding: "8px 14px", borderRadius: 10, border: "none",
          background: subiendo ? "rgba(255,255,255,0.05)" : "rgba(22,199,132,0.15)",
          color: subiendo ? "var(--texto-ter)" : "#16C784",
          fontWeight: 700, fontSize: 12, cursor: subiendo ? "wait" : "pointer", textAlign: "center",
        }}>
          {subiendo ? "Subiendo..." : "+ Agregar video"}
          <input
            type="file"
            accept="video/*"
            disabled={subiendo}
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              await subirVideo(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div style={{ background: "rgba(64,141,255,0.08)", border: "1px solid rgba(64,141,255,0.2)", borderRadius: 12, padding: "10px 12px", marginBottom: 12, color: "var(--texto-sec)", fontSize: 11, lineHeight: 1.5 }}>
        💡 Cada día se muestra un video distinto. La rotación se calcula automáticamente. Si esta empresa no tiene videos, la misión no aparece. Formatos: <code>.mp4</code>, <code>.webm</code>, <code>.mov</code>. Máx <b>50 MB</b> por video.
      </div>

      {videos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24, color: "var(--texto-ter)", fontSize: 12, border: "1px dashed var(--card-border)", borderRadius: 12 }}>
          Aún no hay videos. Sube el primero con "+ Agregar video".
        </div>
      ) : (
        <div style={{
          maxHeight: 480,
          overflowY: "auto",
          padding: 8,
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          background: "rgba(0,0,0,0.15)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {videos.map((v, idx) => (
            <div
              key={v.id || idx}
              style={{
                border: "1px solid var(--card-border)", borderRadius: 12,
                background: "rgba(255,255,255,0.03)", overflow: "hidden",
                display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ background: "#000", aspectRatio: "16/9" }}>
                <video
                  src={resolverUrl(v.url)}
                  controls
                  width="100%"
                  height="100%"
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <div style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "var(--texto)", fontSize: 11, fontWeight: 700 }}>Día rotación: #{idx + 1}</div>
                  <div style={{ color: "var(--texto-ter)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.nombre || v.url}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => eliminar(idx)}
                  style={{
                    padding: "5px 10px", borderRadius: 8, border: "none",
                    background: "rgba(231,76,60,0.15)", color: "#e74c3c",
                    fontSize: 11, cursor: "pointer", fontWeight: 600, flexShrink: 0,
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, padding: 10, borderRadius: 12, border: "1px solid var(--card-border)", background: "rgba(255,255,255,0.03)" }}>
      <span style={{ color: "var(--texto-sec)", fontSize: 12, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 40, border: "none", background: "transparent", padding: 0, flex: "0 0 40px" }}
        />
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            padding: "9px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--texto)",
            outline: "none",
            fontSize: 12,
            boxSizing: "border-box",
          }}
        />
      </div>
    </label>
  );
}
