import { useEffect, useState } from "react";
import { C } from "../constants";
import { guardarConfigMarca } from "../../../utils/marca";

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
        if (res?.data) setForm((f) => ({ ...f, ...res.data }));
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
        if (config) setForm((f) => ({ ...f, ...config }));
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
        ...(esSuperadmin && empresaSeleccionada ? { empresa_id: empresaSeleccionada } : {}),
      };
      const res = await client.put("/admin/config-marca", payload);
      const data = res?.data || form;
      setForm((f) => ({ ...f, ...data }));
      guardarConfigMarca(data);
      setMensaje({ tipo: "exito", texto: "Marca actualizada" });
    } catch (e) {
      setMensaje({ tipo: "error", texto: "No se pudo actualizar" });
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje(null), 2500);
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

      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ color: "var(--texto)", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            🎨 Configuracion de Marca
          </h2>
          <p style={{ color: "var(--texto-sec)", fontSize: 13 }}>
            Cambia logo, nombre y colores sin tocar el codigo.
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                      src={form.logo_url.startsWith("http") ? form.logo_url : `http://localhost:3000${form.logo_url}`}
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
