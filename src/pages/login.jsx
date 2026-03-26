import { useState, useEffect, useRef } from "react";
import client from "../api/client";
import { guardarConfigMarca } from "../utils/marca";
import logoDefault from "../assets/logo.png";
import Terminos from "./Terminos";
import Privacidad from "./Privacidad";
import { ThemeToggle } from "../store/useTheme";

const GOOGLE_CLIENT_ID = "293865702055-8emc40sl54glc8r4og3ur7sbi0eicu43.apps.googleusercontent.com";

export default function Login({ onLoginExitoso }) {
    const [modo, setModo] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mostrarPass, setMostrarPass] = useState(false);
    const [verTerminos, setVerTerminos] = useState(false);
    const [verPrivacidad, setVerPrivacidad] = useState(false);
    const [empresas, setEmpresas] = useState([]);
    const [empresaSlug, setEmpresaSlug] = useState("default");
    const [marcaActual, setMarcaActual] = useState(null);
    const googleBtnRef = useRef(null);
    const empresaSlugRef = useRef(empresaSlug);

    // Mantener ref actualizado para el callback de Google
    useEffect(() => { empresaSlugRef.current = empresaSlug; }, [empresaSlug]);

    // Cargar empresas activas
    useEffect(() => {
        client.get("/auth/empresas-activas")
            .then((res) => setEmpresas(res.data || []))
            .catch(() => {});
    }, []);

    // Cuando cambia la empresa, cargar su config de marca
    useEffect(() => {
        client.get(`/auth/config-publica/${empresaSlug}`)
            .then((res) => {
                if (res?.data) {
                    guardarConfigMarca(res.data);
                    setMarcaActual(res.data);
                }
            })
            .catch(() => {});
    }, [empresaSlug]);

    useEffect(() => {
        const initGoogle = () => {
            if (window.google?.accounts) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: manejarGoogle,
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: "outline",
                    size: "large",
                    width: 396,
                    text: "continue_with",
                    shape: "pill",
                    locale: "es",
                });
            }
        };
        // Esperar a que cargue el script de Google
        if (window.google?.accounts) {
            initGoogle();
        } else {
            const interval = setInterval(() => {
                if (window.google?.accounts) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    const manejarGoogle = async (response) => {
        setCargando(true);
        setError("");
        try {
            const res = await client.post("/auth/google", { credential: response.credential, empresa_slug: empresaSlugRef.current });
            const usuario = { ...res.data.usuario, googleNombre: res.data.googleNombre };
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("usuario", JSON.stringify(usuario));
            onLoginExitoso(usuario);
        } catch (e) {
            const msg = e.response?.data?.message;
            setError(Array.isArray(msg) ? msg[0] : msg || "Error al iniciar con Google");
        } finally {
            setCargando(false);
        }
    };

    const limpiar = () => setError("");

    const manejarEmailPassword = async () => {
        if (!email || !password) { setError("Completa todos los campos"); return; }
        if (modo === "registro" && password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
        setCargando(true); setError("");
        try {
            const endpoint = modo === "login" ? "/auth/login" : "/auth/registro";
            const res = await client.post(endpoint, { email, password, empresa_slug: empresaSlug });

            // Guardar token y datos del usuario
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("usuario", JSON.stringify(res.data.usuario));

            onLoginExitoso(res.data.usuario);
        } catch (e) {
            const msg = e.response?.data?.message;
            setError(Array.isArray(msg) ? msg[0] : msg || "Ocurrió un error. Intenta de nuevo");
        } finally {
            setCargando(false);
        }
    };

    if (verTerminos) return <Terminos onVolver={() => setVerTerminos(false)} />;
    if (verPrivacidad) return <Privacidad onVolver={() => setVerPrivacidad(false)} />;

    return (
        <div style={s.root}>
            <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}><ThemeToggle /></div>
            <div style={s.bgGradient} />
            <div style={s.bgNoise} />

            <div style={s.card}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <img
                        src={marcaActual?.logo_url ? (marcaActual.logo_url.startsWith("http") ? marcaActual.logo_url : `http://localhost:3000${marcaActual.logo_url}`) : logoDefault}
                        alt={marcaActual?.nombre_app || "CLTiene Mundial"}
                        style={{ width: "200px", height: "auto", display: "block", margin: "0 auto" }}
                    />
                    <div style={{ color: "var(--brand-accent)", fontWeight: 700, fontSize: "14px", marginTop: "6px" }}>
                        {marcaActual?.subtitulo || "Mundial 2026"} ⚽
                    </div>
                </div>

                <p style={s.desc}>
                    {modo === "login"
                        ? "Ingresa para gestionar tus apuestas y premios"
                        : "Regístrate y obtén un bono de bienvenida"}
                </p>

                {/* Selector de empresa */}
                {empresas.length > 1 && (
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", color: "#7D7765", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                            Selecciona tu organizacion
                        </label>
                        <select
                            value={empresaSlug}
                            onChange={(e) => setEmpresaSlug(e.target.value)}
                            style={{
                                width: "100%", padding: "12px 14px",
                                background: "#F8F7F5", border: "1.5px solid #E5E3DF",
                                borderRadius: "12px", color: "#231F20", fontSize: "14px",
                                outline: "none", cursor: "pointer", boxSizing: "border-box",
                            }}
                        >
                            {empresas.map((emp) => (
                                <option key={emp.slug} value={emp.slug}>{emp.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}

                {error && (
                    <div style={s.errorBox}>
                        <span style={{ marginRight: "6px" }}>⚠️</span>{error}
                    </div>
                )}

                {/* Email */}
                <div style={s.inputWrap}>
                    <span style={s.inputIcono}>✉️</span>
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); limpiar(); }}
                        style={s.input}
                        autoFocus
                    />
                </div>

                {/* Password */}
                <div style={s.inputWrap}>
                    <span style={s.inputIcono}>🔒</span>
                    <input
                        type={mostrarPass ? "text" : "password"}
                        placeholder={modo === "registro" ? "Contraseña (mínimo 6 caracteres)" : "Contraseña"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); limpiar(); }}
                        style={{ ...s.input, paddingRight: "44px" }}
                        onKeyDown={(e) => e.key === "Enter" && manejarEmailPassword()}
                    />
                    <button onClick={() => setMostrarPass(!mostrarPass)} style={s.ojito}>
                        {mostrarPass ? "🙈" : "👁️"}
                    </button>
                </div>

                {/* Botón principal */}
                <button
                    onClick={manejarEmailPassword}
                    disabled={cargando}
                    style={{ ...s.btnPrimario, opacity: cargando ? 0.8 : 1 }}
                >
                    {cargando ? "Cargando..." : modo === "login" ? "✓ Ingresar" : "✓ Crear cuenta"}
                </button>

                {/* Divisor */}
                <div style={s.divisor}>
                    <div style={s.linea} />
                    <span style={s.oText}>o</span>
                    <div style={s.linea} />
                </div>

                {/* Google */}
                <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }} />

                {/* Switch login/registro */}
                <div style={s.switchWrap}>
                    {modo === "login" ? (
                        <>
                            <span style={s.switchText}>¿Aún no tienes cuenta?</span>
                            <p style={s.switchSub}>Regístrate ahora y obtén un bono de bienvenida</p>
                            <button onClick={() => { setModo("registro"); limpiar(); }} style={s.btnRegistro}>
                                Crear Cuenta y Ganar 100 Monedas 🎁
                            </button>
                        </>
                    ) : (
                        <>
                            <span style={s.switchText}>¿Ya tienes cuenta?</span>
                            <br />
                            <button onClick={() => { setModo("login"); limpiar(); }} style={{ ...s.btnRegistro, marginTop: "12px" }}>
                                Iniciar sesión
                            </button>
                        </>
                    )}
                </div>

                <p style={s.legal}>
                    Al ingresar aceptas los{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); setVerTerminos(true); }} style={{ color: "var(--brand-primary)" }}>Términos y Condiciones</a>
                    {" "}y la{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); setVerPrivacidad(true); }} style={{ color: "var(--brand-primary)" }}>Política de Privacidad</a>
                    {" "}de {marcaActual?.nombre_app || "CLTiene"}.
                </p>
            </div>
        </div>
    );
}

const s = {
    root: {
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", fontFamily: "'Segoe UI', system-ui, sans-serif",
        overflow: "hidden", padding: "24px 16px",
    },
    bgGradient: {
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #1a0a00 0%, #231F20 30%, #0d0820 60%, #0a1628 100%)",
    },
    bgNoise: {
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
      radial-gradient(ellipse at 15% 50%, #FD775130 0%, transparent 45%),
      radial-gradient(ellipse at 85% 20%, #822BD225 0%, transparent 45%),
      radial-gradient(ellipse at 60% 80%, #408DFF15 0%, transparent 40%)
    `,
    },
    card: {
        position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.97)",
        borderRadius: "20px", width: "100%", maxWidth: "460px",
        padding: "36px 32px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
    },
    desc: { color: "#7D7765", fontSize: "14px", textAlign: "center", marginBottom: "24px", marginTop: "4px" },
    errorBox: {
        background: "#FFF0EE", border: "1px solid #FD775150",
        borderRadius: "10px", padding: "10px 14px",
        color: "#c0392b", fontSize: "14px", marginBottom: "16px",
        display: "flex", alignItems: "center",
    },
    inputWrap: { position: "relative", marginBottom: "12px", display: "flex", alignItems: "center" },
    inputIcono: { position: "absolute", left: "14px", fontSize: "16px", pointerEvents: "none" },
    input: {
        width: "100%", padding: "13px 14px 13px 42px",
        background: "#F8F7F5", border: "1.5px solid #E5E3DF",
        borderRadius: "12px", color: "#231F20", fontSize: "14px",
        outline: "none", boxSizing: "border-box",
    },
    ojito: {
        position: "absolute", right: "12px",
        background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "4px",
    },
    btnPrimario: {
        width: "100%", padding: "14px",
        background: "linear-gradient(135deg, #FC3276, #822BD2)",
        color: "#fff", border: "none", borderRadius: "12px",
        fontSize: "16px", fontWeight: 700, cursor: "pointer",
        boxShadow: "0 6px 24px rgba(252,50,118,0.4)",
        marginBottom: "16px",
    },
    divisor: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
    linea: { flex: 1, height: "1px", background: "#E5E3DF" },
    oText: { color: "#999999", fontSize: "13px" },
    switchWrap: { borderTop: "1px solid #E5E3DF", paddingTop: "20px", textAlign: "center" },
    switchText: { color: "#231F20", fontWeight: 700, fontSize: "15px" },
    switchSub: { color: "#999999", fontSize: "13px", margin: "4px 0 12px" },
    btnRegistro: {
        width: "100%", padding: "13px", background: "transparent",
        border: "2px solid #408DFF", borderRadius: "12px",
        color: "#408DFF", fontSize: "14px", fontWeight: 700, cursor: "pointer",
    },
    legal: { color: "#999999", fontSize: "12px", textAlign: "center", marginTop: "16px", lineHeight: 1.5 },
};
