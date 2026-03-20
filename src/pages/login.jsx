import { useState, useEffect } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";

import { auth } from "../firebase/config";
import client from "../api/client";
import logo from "../assets/logo.png";
import Terminos from "./Terminos";




const googleProvider = new GoogleAuthProvider();

const traducirError = (code) => {
    const e = {
        "auth/user-not-found": "No existe una cuenta con este correo",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/email-already-in-use": "Este correo ya está registrado",
        "auth/invalid-email": "Correo electrónico inválido",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
        "auth/popup-closed-by-user": "Cerraste el popup de Google",
        "auth/invalid-credential": "Correo o contraseña incorrectos",
    };
    return e[code] || "Ocurrió un error. Intenta de nuevo";
};


<img src="/src/assets/logo.png" alt="CLTiene" style={{ width: "72px", height: "72px", objectFit: "contain" }} />

export default function Login({ onLoginExitoso }) {
    const [modo, setModo] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mostrarPass, setMostrarPass] = useState(false);
    const [verTerminos, setVerTerminos] = useState(false);



    const limpiar = () => setError("");

    const verificarPerfil = async (uid) => {
        try {
            const res = await client.get(`/jugadores/${uid}`);
            return res.data;
        } catch {
            return null;
        }
    };



    const manejarEmailPassword = async () => {
        if (!email || !password) { setError("Completa todos los campos"); return; }
        if (password.length < 5) { setError("La contraseña debe tener al menos 5 caracteres"); return; }
        setCargando(true); setError("");
        try {
            const cred = modo === "login"
                ? await signInWithEmailAndPassword(auth, email, password)
                : await createUserWithEmailAndPassword(auth, email, password);
            const perfil = await verificarPerfil(cred.user.uid);
            onLoginExitoso(cred.user, perfil);
        } catch (e) {
            console.log("Error code:", e.code, "Message:", e.message);
            setError(traducirError(e.code));
        }
        finally { setCargando(false); }
    };

    const manejarGoogle = async () => {
        setCargando(true);
        setError("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const perfil = await verificarPerfil(result.user.uid);
            onLoginExitoso(result.user, perfil);
        } catch (e) {
            setError(traducirError(e.code));
        } finally {
            setCargando(false);
        }
    };

    if (verTerminos) return <Terminos onVolver={() => setVerTerminos(false)} />;

    return (
        <div style={s.root}>
            <div style={s.bgGradient} />
            <div style={s.bgNoise} />

            <div style={s.card}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <img
                        src={logo}
                        alt="CLTiene"
                        style={{ width: "200px", height: "auto", display: "block", margin: "0 auto" }}
                    />
                    <div style={{ color: "#FC3276", fontWeight: 700, fontSize: "14px", marginTop: "6px" }}>
                        Mundial 2026 ⚽
                    </div>
                </div>

                <p style={s.desc}>
                    {modo === "login"
                        ? "Ingresa para gestionar tus apuestas y premios"
                        : "Regístrate y obtén un bono de bienvenida"}
                </p>

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
                        placeholder="Correo electrónico (ej: demo@cltiene.com)"
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
                        placeholder="Contraseña (mínimo 5 caracteres)"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); limpiar(); }}
                        style={{ ...s.input, paddingRight: "44px" }}
                        onKeyDown={(e) => e.key === "Enter" && manejarEmailPassword()}
                    />
                    <button onClick={() => setMostrarPass(!mostrarPass)} style={s.ojito}>
                        {mostrarPass ? "🙈" : "👁️"}
                    </button>
                </div>

                {modo === "login" && (
                    <div style={{ textAlign: "right", marginBottom: "20px" }}>
                        <button style={s.linkBtn}>¿Olvidaste tu contraseña?</button>
                    </div>
                )}

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
                <button onClick={manejarGoogle} disabled={cargando} style={s.btnGoogle}>
                    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Continuar con Google
                </button>

                {/* SSO */}
                <button onClick={() => setError("SSO corporativo próximamente disponible")} style={s.btnSSO}>
                    🏢 SSO Corporativo CLTiene
                </button>

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
                    <a href="#" onClick={(e) => { e.preventDefault(); setVerTerminos(true); }} style={{ color: "#FD7751" }}>Términos y Condiciones</a>
                    {" "}y la{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); setVerTerminos(true); }} style={{ color: "#FD7751" }}>Política de Privacidad</a>
                    {" "}de CLTiene.
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
    logoWrap: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginBottom: "12px"
    },
    logoIconoWrap: {
        display: "flex",
        justifyContent: "center",
        width: "100%",
        marginBottom: "4px"
    },
    logoNombre: { color: "#231F20", fontWeight: 800, fontSize: "26px", lineHeight: 1 },
    logoMundial: { color: "#FD7751", fontWeight: 700, fontSize: "15px", marginTop: "2px" },
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
    linkBtn: {
        background: "none", border: "none", color: "#408DFF",
        fontSize: "13px", cursor: "pointer", padding: 0, fontWeight: 500,
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
    btnGoogle: {
        width: "100%", padding: "12px",
        background: "#F8F7F5", border: "1.5px solid #E5E3DF",
        borderRadius: "12px", color: "#231F20", fontSize: "14px", fontWeight: 500,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        gap: "10px", marginBottom: "10px",
    },
    btnSSO: {
        width: "100%", padding: "12px", background: "transparent",
        border: "1.5px solid #E5E3DF", borderRadius: "12px",
        color: "#7D7765", fontSize: "14px", cursor: "pointer", marginBottom: "20px",
    },
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
