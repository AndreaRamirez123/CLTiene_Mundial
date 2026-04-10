import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import client from "../api/client";
import { guardarConfigMarca } from "../utils/marca";
import logoDefault from "../assets/logo.png";
import Terminos from "./Terminos";
import Privacidad from "./Privacidad";
import { ThemeToggle } from "../store/useTheme";

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
const esNativo = Capacitor.isNativePlatform();


function evaluarPassword(pass) {
    const reglas = [
        { test: pass.length >= 8, label: "Mínimo 8 caracteres" },
        { test: pass !== pass.toLowerCase(), label: "Una letra mayúscula" },
        { test: pass !== pass.toUpperCase(), label: "Una letra minúscula" },
        { test: /\d/.test(pass), label: "Un número" },
        { test: /[^a-zA-Z0-9\s]/.test(pass), label: "Un carácter especial (!@#$...)" },
    ];
    const cumplidas = reglas.filter((r) => r.test).length;
    const nivel = cumplidas <= 1 ? "Muy débil" : cumplidas === 2 ? "Débil" : cumplidas === 3 ? "Media" : cumplidas === 4 ? "Fuerte" : "Muy fuerte";
    const color = cumplidas <= 1 ? "#ED1E28" : cumplidas === 2 ? "#FD7751" : cumplidas === 3 ? "#ECA82D" : cumplidas === 4 ? "#16C784" : "#059669";
    return { reglas, cumplidas, total: reglas.length, nivel, color, esValida: cumplidas >= 4 };
}

function PasswordStrength({ password }) {
    if (!password) return null;
    const { reglas, cumplidas, total, nivel, color } = evaluarPassword(password);
    return (
        <div style={{ marginBottom: 12, marginTop: -4 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i < cumplidas ? color : "#E5E3DF",
                        transition: "background 0.3s",
                    }} />
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{nivel}</span>
                <span style={{ fontSize: 11, color: "#999" }}>{cumplidas}/{total}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 6 }}>
                {reglas.map((r, i) => (
                    <span key={i} style={{ fontSize: 11, color: r.test ? "#059669" : "#999", display: "flex", alignItems: "center", gap: 3 }}>
                        {r.test ? "✓" : "○"} {r.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function Login({ onLoginExitoso, onPreRegistro }) {
    const [modo, setModo] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [mostrarPass, setMostrarPass] = useState(false);
    const [codigoReset, setCodigoReset] = useState("");
    const [nuevaPassword, setNuevaPassword] = useState("");
    const [verTerminos, setVerTerminos] = useState(false);
    const [verPrivacidad, setVerPrivacidad] = useState(false);
    const [empresas, setEmpresas] = useState([]);
    const [empresaSlug, setEmpresaSlug] = useState("default");
    const [marcaActual, setMarcaActual] = useState(null);
    const googleBtnRef = useRef(null);
    const empresaSlugRef = useRef(empresaSlug);


    useEffect(() => { empresaSlugRef.current = empresaSlug; }, [empresaSlug]);


    useEffect(() => {
        client.get("/auth/empresas-activas")
            .then((res) => {
                setEmpresas(res.data || [])
            })
            .catch(() => { });
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
            .catch(() => { });
    }, [empresaSlug]);

    // Inicializar SocialLogin en nativo
    useEffect(() => {
        if (esNativo) {
            SocialLogin.initialize({
                google: { webClientId: GOOGLE_CLIENT_ID },
            }).catch((e) => console.error("SocialLogin init error:", e));
        }
    }, []);

    const initGoogle = () => {
        if (esNativo) return; // En nativo usamos el botón custom
        try {
            if (window.google?.accounts && googleBtnRef.current) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: manejarGoogle,
                });
                const ancho = Math.min(googleBtnRef.current.offsetWidth || 396, 396);
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: "outline",
                    size: "large",
                    width: ancho,
                    text: "continue_with",
                    shape: "pill",
                    locale: "es",
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (esNativo) return;
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


    useEffect(() => {
        if (esNativo) return;
        if (modo === "login" || modo === "registro") {
            setTimeout(() => initGoogle(), 50);
        }
    }, [modo]);

    const loginGoogleNativo = async () => {
        setCargando(true);
        setError("");
        try {
            const result = await SocialLogin.login({
                provider: "google",
                options: { scopes: ["email", "profile"] },
            });
            const idToken = result?.result?.idToken;
            if (!idToken) throw new Error("No se obtuvo el token de Google");
            await manejarGoogle({ credential: idToken });
        } catch (e) {
            if (e?.message?.includes("canceled") || e?.message?.includes("cancelled")) return;
            // setError(e?.message || "Error al iniciar con Google");
            setError(typeof e === "string" ? e : JSON.stringify(e));
        } finally {
            setCargando(false);
        }
    };

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
            // setError(Array.isArray(msg) ? msg[0] : msg || "Error al iniciar con Google");
            setError(typeof e === "string" ? e : JSON.stringify(e));
        } finally {
            setCargando(false);
        }
    };

    const limpiar = () => { setError(""); setExito(""); };

    const manejarEmailPassword = async () => {
        if (!email || !password) { setError("Completa todos los campos"); return; }
        if (modo === "registro" && !evaluarPassword(password).esValida) { setError("La contraseña no cumple los requisitos mínimos de seguridad"); return; }

        // Registro: no crear en DB, solo pasar credenciales al flujo de registro
        if (modo === "registro") {
            onPreRegistro({ email, password, empresa_slug: empresaSlug });
            return;
        }

        setCargando(true); setError("");
        try {
            const res = await client.post("/auth/login", { email, password, empresa_slug: empresaSlug });
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

    const solicitarCodigo = async () => {
        if (!email) { setError("Ingresa tu correo electrónico"); return; }
        setCargando(true); setError(""); setExito("");
        try {
            const res = await client.post("/auth/solicitar-reset", { email, empresa_slug: empresaSlug });
            setExito(res.data.mensaje);
            setModo("reset-codigo");
        } catch (e) {
            const msg = e.response?.data?.message;
            setError(Array.isArray(msg) ? msg[0] : msg || "Error al enviar el código");
        } finally {
            setCargando(false);
        }
    };

    const resetearPassword = async () => {
        if (!codigoReset || !nuevaPassword) { setError("Completa todos los campos"); return; }
        if (!evaluarPassword(nuevaPassword).esValida) { setError("La contraseña no cumple los requisitos mínimos de seguridad"); return; }
        setCargando(true); setError(""); setExito("");
        try {
            const res = await client.post("/auth/reset-password", {
                email, codigo: codigoReset, nueva_password: nuevaPassword, empresa_slug: empresaSlug,
            });
            setExito(res.data.mensaje);
            setCodigoReset(""); setNuevaPassword("");
            setTimeout(() => { setModo("login"); setExito(""); }, 2000);
        } catch (e) {
            const msg = e.response?.data?.message;
            setError(Array.isArray(msg) ? msg[0] : msg || "Error al cambiar la contraseña");
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
                        src={marcaActual?.logo_url ? (marcaActual.logo_url.startsWith("http") ? marcaActual.logo_url : `${import.meta.env.VITE_API_BASE_URL || ''}${marcaActual.logo_url}`) : logoDefault}
                        alt={marcaActual?.nombre_app || "CLTiene Mundial"}
                        style={{ width: "200px", height: "auto", display: "block", margin: "0 auto" }}
                    />
                    <div style={{ color: marcaActual?.color_acento || "var(--brand-accent)", fontWeight: 700, fontSize: "14px", marginTop: "6px" }}>
                        {marcaActual?.subtitulo || "Mundial 2026"} ⚽
                    </div>
                </div>

                <p style={s.desc}>
                    {modo === "login" && "Ingresa para gestionar tus apuestas y premios: "}
                    {modo === "registro" && "Regístrate y obtén un bono de bienvenida"}
                    {modo === "reset-email" && "Ingresa tu correo para recuperar tu contraseña"}
                    {modo === "reset-codigo" && "Ingresa el código que recibiste en tu correo"}
                </p>

                {/* Selector de empresa */}
                {empresas.length >= 1 && (
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", color: "var(--texto-sec)", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                            Selecciona tu organizacion
                        </label>
                        <select
                            value={empresaSlug}
                            onChange={(e) => setEmpresaSlug(e.target.value)}
                            style={{
                                width: "100%", padding: "12px 14px",
                                background: "var(--input-bg)", border: "1.5px solid var(--input-border)",
                                borderRadius: "12px", color: "var(--texto)", fontSize: "14px",
                                outline: "none", cursor: "pointer", boxSizing: "border-box",
                            }}
                        >
                            {empresas.map((emp) => (
                                <option key={emp.slug} value={emp.slug} style={{ background: "#fff", color: "#231F20" }}>{emp.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}

                {error && (
                    <div style={s.errorBox}>
                        <span style={{ marginRight: "6px" }}>⚠️</span>{error}
                    </div>
                )}

                {exito && (
                    <div style={s.exitoBox}>
                        <span style={{ marginRight: "6px" }}>✅</span>{exito}
                    </div>
                )}

                {/* === VISTA: Login / Registro === */}
                {(modo === "login" || modo === "registro") && (
                    <>
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

                        {modo === "registro" && <PasswordStrength password={password} />}

                        {/* Olvidaste tu contraseña */}
                        {modo === "login" && (
                            <div style={{ textAlign: "right", marginBottom: "12px", marginTop: "-4px" }}>
                                <button
                                    onClick={() => { setModo("reset-email"); limpiar(); }}
                                    style={s.linkBtn}
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {/* Botón principal */}
                        <button
                            onClick={manejarEmailPassword}
                            disabled={cargando}
                            style={{ ...s.btnPrimario, background: `linear-gradient(135deg, ${marcaActual?.color_primario || "#FC3276"}, ${marcaActual?.color_secundario || "#822BD2"})`, boxShadow: `0 6px 24px ${(marcaActual?.color_primario || "#FC3276") + "66"}`, opacity: cargando ? 0.8 : 1 }}
                        >
                            {cargando ? "Cargando..." : modo === "login" ? "✓ Ingresar" : "✓ Crear cuenta"} { }
                        </button>

                        {/* Divisor */}
                        <div style={s.divisor}>
                            <div style={s.linea} />
                            <span style={s.oText}>o</span>
                            <div style={s.linea} />
                        </div>

                        {/* Google */}
                        {esNativo ? (
                            <button
                                onClick={loginGoogleNativo}
                                disabled={cargando}
                                style={s.btnGoogle}
                            >
                                <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                </svg>
                                Continuar con Google
                            </button>
                        ) : (
                            <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }} />
                        )}

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
                    </>
                )}

                {/* === VISTA: Reset - Ingresar email === */}
                {modo === "reset-email" && (
                    <>
                        <div style={s.inputWrap}>
                            <span style={s.inputIcono}>✉️</span>
                            <input
                                type="email"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); limpiar(); }}
                                style={s.input}
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && solicitarCodigo()}
                            />
                        </div>

                        <button
                            onClick={solicitarCodigo}
                            disabled={cargando}
                            style={{ ...s.btnPrimario, background: `linear-gradient(135deg, ${marcaActual?.color_primario || "#FC3276"}, ${marcaActual?.color_secundario || "#822BD2"})`, boxShadow: `0 6px 24px ${(marcaActual?.color_primario || "#FC3276") + "66"}`, opacity: cargando ? 0.8 : 1 }}
                        >
                            {cargando ? "Enviando..." : "Enviar código de recuperación"}
                        </button>

                        <div style={{ textAlign: "center", marginTop: "12px" }}>
                            <button onClick={() => { setModo("login"); limpiar(); }} style={s.linkBtn}>
                                Volver al inicio de sesión
                            </button>
                        </div>
                    </>
                )}

                {/* === VISTA: Reset - Ingresar código y nueva contraseña === */}
                {modo === "reset-codigo" && (
                    <>
                        <div style={s.inputWrap}>
                            <span style={s.inputIcono}>🔑</span>
                            <input
                                type="text"
                                placeholder="Ingresa el código"
                                value={codigoReset}
                                onChange={(e) => { setCodigoReset(e.target.value.replace(/\D/g, "").slice(0, 6)); limpiar(); }}
                                style={{
                                    ...s.input,
                                    textAlign: "center",
                                    ...(codigoReset ? { letterSpacing: "10px", fontSize: "24px", fontWeight: 700 } : {}),
                                }}
                                maxLength={6}
                                autoFocus
                            />
                        </div>

                        <div style={s.inputWrap}>
                            <span style={s.inputIcono}>🔒</span>
                            <input
                                type={mostrarPass ? "text" : "password"}
                                placeholder="Nueva contraseña (mínimo 6 caracteres)"
                                value={nuevaPassword}
                                onChange={(e) => { setNuevaPassword(e.target.value); limpiar(); }}
                                style={{ ...s.input, paddingRight: "44px" }}
                                onKeyDown={(e) => e.key === "Enter" && resetearPassword()}
                            />
                            <button onClick={() => setMostrarPass(!mostrarPass)} style={s.ojito}>
                                {mostrarPass ? "🙈" : "👁️"}
                            </button>
                        </div>

                        <PasswordStrength password={nuevaPassword} />

                        <button
                            onClick={resetearPassword}
                            disabled={cargando}
                            style={{ ...s.btnPrimario, background: `linear-gradient(135deg, ${marcaActual?.color_primario || "#FC3276"}, ${marcaActual?.color_secundario || "#822BD2"})`, boxShadow: `0 6px 24px ${(marcaActual?.color_primario || "#FC3276") + "66"}`, opacity: cargando ? 0.8 : 1 }}
                        >
                            {cargando ? "Cambiando..." : "Cambiar contraseña"}
                        </button>

                        <div style={{ textAlign: "center", marginTop: "8px" }}>
                            <button onClick={solicitarCodigo} disabled={cargando} style={s.linkBtn}>
                                Reenviar código
                            </button>
                        </div>

                        <div style={{ textAlign: "center", marginTop: "8px" }}>
                            <button onClick={() => { setModo("login"); limpiar(); setCodigoReset(""); setNuevaPassword(""); }} style={s.linkBtn}>
                                Volver al inicio de sesión
                            </button>
                        </div>
                    </>
                )}

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
        background: "var(--bg-gradient)",
    },
    bgNoise: {
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
      radial-gradient(ellipse at 15% 50%, rgba(var(--brand-primary-rgb),0.19) 0%, transparent 45%),
      radial-gradient(ellipse at 85% 20%, #822BD225 0%, transparent 45%),
      radial-gradient(ellipse at 60% 80%, #408DFF15 0%, transparent 40%)
    `,
    },
    card: {
        position: "relative", zIndex: 1,
        background: "var(--card)",
        borderRadius: "20px", width: "100%", maxWidth: "460px",
        padding: "36px 32px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--card-border)",
    },
    desc: { color: "var(--texto-sec)", fontSize: "14px", textAlign: "center", marginBottom: "24px", marginTop: "4px" },
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
        background: "var(--input-bg)", border: "1.5px solid var(--input-border)",
        borderRadius: "12px", color: "var(--texto)", fontSize: "14px",
        outline: "none", boxSizing: "border-box",
    },
    ojito: {
        position: "absolute", right: "12px",
        background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "4px",
        color: "var(--texto-ter)",
    },
    btnPrimario: {
        width: "100%", padding: "14px",
        color: "#fff", border: "none", borderRadius: "12px",
        fontSize: "16px", fontWeight: 700, cursor: "pointer",
        marginBottom: "16px",
    },
    divisor: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
    linea: { flex: 1, height: "1px", background: "var(--input-border)" },
    oText: { color: "var(--texto-ter)", fontSize: "13px" },
    switchWrap: { borderTop: "1px solid var(--input-border)", paddingTop: "20px", textAlign: "center" },
    switchText: { color: "var(--texto)", fontWeight: 700, fontSize: "15px" },
    switchSub: { color: "var(--texto-ter)", fontSize: "13px", margin: "4px 0 12px" },
    btnRegistro: {
        width: "100%", padding: "13px", background: "transparent",
        border: "2px solid #408DFF", borderRadius: "12px",
        color: "#408DFF", fontSize: "14px", fontWeight: 700, cursor: "pointer",
    },
    exitoBox: {
        background: "#EAFFF3", border: "1px solid #34D39950",
        borderRadius: "10px", padding: "10px 14px",
        color: "#059669", fontSize: "14px", marginBottom: "16px",
        display: "flex", alignItems: "center",
    },
    linkBtn: {
        background: "none", border: "none", color: "#822BD2",
        fontSize: "13px", cursor: "pointer", padding: 0,
        textDecoration: "underline",
    },
    legal: { color: "var(--texto-ter)", fontSize: "12px", textAlign: "center", marginTop: "16px", lineHeight: 1.5 },
    btnGoogle: {
        width: "100%", padding: "12px 14px",
        background: "#fff", border: "1.5px solid #dadce0",
        borderRadius: "24px", fontSize: "14px", fontWeight: 500,
        color: "#3c4043", cursor: "pointer", marginBottom: "16px",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
};
