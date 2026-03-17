import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import logo from "../assets/logo.png";

const C = {
    naranja: "#FD7751",
    dorado: "#ECA82D",
    morado: "#822BD2",
    rosa: "#FC3276",
    azul: "#408DFF",
    rojo: "#ED1E28",
    grisClaro: "#999999",
    grisOsc: "#7D7765",
    blanco: "#ffffff",
    negro: "#1f2321",
};

export default function Registro({ usuario, onRegistroCompleto }) {
    const [step, setStep] = useState(0);
    const [aceptado, setAceptado] = useState(false);
    const [form, setForm] = useState({
        tipojugador: "", relacionCLTiene: "", esReferido: null,
        nombreReferidor: "", nombre: "", telefono: "", correo: "",
    });
    const [completado, setCompletado] = useState(false);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const validar = () => {
        const e = {};
        if (step === 1 && !form.tipojugador) e.tipojugador = "Selecciona una opción";
        if (step === 2 && !form.relacionCLTiene) e.relacionCLTiene = "Selecciona una opción";
        if (step === 3 && form.esReferido === null) e.esReferido = "Selecciona una opción";
        if (step === 4 && form.esReferido && !form.nombreReferidor.trim()) e.nombreReferidor = "Ingresa el nombre";
        if ((step === 4 && !form.esReferido) || step === 5)
            if (!form.nombre.trim()) e.nombre = "Ingresa tu nombre";
        if (step === 6 && !form.telefono.trim()) e.telefono = "Ingresa tu número";
        if (step === 7 && !form.correo.trim()) e.correo = "Ingresa tu correo";
        if (step === 7 && form.correo && !/\S+@\S+\.\S+/.test(form.correo)) e.correo = "Correo inválido";
        setErrores(e);
        return Object.keys(e).length === 0;
    };

    const guardarEnFirestore = async (datos) => {
        if (!usuario?.uid) return;
        setGuardando(true);
        try {
            await setDoc(doc(db, "jugadores", usuario.uid), {
                ...datos,
                uid: usuario.uid,
                email: usuario.email,
                monedas: 100,
                nivel: "activo",
                predicciones: 0,
                createdAt: new Date().toISOString(),
            });
        } catch (err) {
            console.error("Error guardando perfil:", err);
        } finally {
            setGuardando(false);
        }
    };

    const siguiente = async () => {
        if (!validar()) return;
        if (step === 3 && form.esReferido === false) { setStep(5); return; }
        if (step === 7) {
            await guardarEnFirestore(form);
            setCompletado(true);
            if (onRegistroCompleto) onRegistroCompleto({ ...form, monedas: 100 });
            return;
        }
        setStep((s) => s + 1);
    };

    const anterior = () => {
        if (step === 5 && form.esReferido === false) { setStep(3); return; }
        setStep((s) => Math.max(0, s - 1));
    };

    const pasoActual = form.esReferido === false && step >= 5 ? step - 1 : step;
    const totalPasos = form.esReferido === false ? 6 : 7;
    const progreso = step === 0 ? 0 : Math.round((pasoActual / totalPasos) * 100);

    if (completado) return <PantallaFinal nombre={form.nombre} />;

    return (
        <div style={s.root}>
            <div style={s.bgGradient} />
            <div style={s.bgNoise} />
            <div style={s.circulo1} />
            <div style={s.circulo2} />

            <div style={s.card}>
                {/* Header con logo */}
                <div style={s.header}>
                    <div style={{ textAlign: "center", marginBottom: "4px" }}>
                        <img src={logo} alt="CLTiene" style={{ width: "140px", height: "auto", display: "block", margin: "0 auto" }} />
                        <div style={{ color: C.naranja, fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>
                            Mundial 2026 ⚽
                        </div>
                    </div>

                    {step > 0 && (
                        <div style={s.progresoWrap}>
                            <div style={s.progresoBar}>
                                <div style={{ ...s.progresoFill, width: `${progreso}%` }} />
                            </div>
                            <span style={s.progresoText}>Paso {pasoActual} de {totalPasos}</span>
                        </div>
                    )}
                </div>

                {/* Contenido */}
                <div style={s.body}>
                    {step === 0 && <PantallaBienvenida aceptado={aceptado} setAceptado={setAceptado} />}
                    {step === 1 && (
                        <PantallaOpcion
                            titulo="¿Cómo te identificas principalmente?"
                            opciones={[
                                { valor: "natural", icono: "👤", label: "Persona natural" },
                                { valor: "empresa", icono: "🏢", label: "Empresa / Emprendedor" },
                                { valor: "organizacion", icono: "🤝", label: "Represento una organización" },
                                { valor: "explorar", icono: "🔍", label: "Solo quiero jugar y conocer CLTiene" },
                            ]}
                            valor={form.tipojugador}
                            onChange={(v) => set("tipojugador", v)}
                            error={errores.tipojugador}
                        />
                    )}
                    {step === 2 && (
                        <PantallaOpcion
                            titulo="¿Cuál es tu relación actual con CLTiene?"
                            opciones={[
                                { valor: "cliente", icono: "✅", label: "Ya soy cliente" },
                                { valor: "escuchado", icono: "👂", label: "He escuchado de CLTiene" },
                                { valor: "explorando", icono: "🔭", label: "Estoy explorando opciones" },
                                { valor: "nuevo", icono: "🌟", label: "No conocía CLTiene hasta ahora" },
                            ]}
                            valor={form.relacionCLTiene}
                            onChange={(v) => set("relacionCLTiene", v)}
                            error={errores.relacionCLTiene}
                        />
                    )}
                    {step === 3 && (
                        <PantallaReferido
                            valor={form.esReferido}
                            onChange={(v) => set("esReferido", v)}
                            error={errores.esReferido}
                        />
                    )}
                    {step === 4 && form.esReferido && (
                        <PantallaInput
                            titulo="¿Quién te refirió?"
                            descripcion="Ingresa el nombre de quien te invitó para que reciba su bono de 50 monedas."
                            placeholder="Nombre del referidor"
                            valor={form.nombreReferidor}
                            onChange={(v) => set("nombreReferidor", v)}
                            error={errores.nombreReferidor}
                        />
                    )}
                    {((step === 4 && !form.esReferido) || step === 5) && (
                        <PantallaInput
                            titulo="¿Cuál es tu nombre?"
                            placeholder="Tu nombre completo"
                            valor={form.nombre}
                            onChange={(v) => set("nombre", v)}
                            error={errores.nombre}
                        />
                    )}
                    {step === 6 && (
                        <PantallaInput
                            titulo="¿Cuál es tu número de contacto?"
                            placeholder="Ej: 300 123 4567"
                            tipo="tel"
                            valor={form.telefono}
                            onChange={(v) => set("telefono", v)}
                            error={errores.telefono}
                        />
                    )}
                    {step === 7 && (
                        <PantallaInput
                            titulo="¿Cuál es tu correo electrónico?"
                            placeholder="tucorreo@ejemplo.com"
                            tipo="email"
                            valor={form.correo}
                            onChange={(v) => set("correo", v)}
                            error={errores.correo}
                        />
                    )}
                </div>

                {/* Footer */}
                <div style={s.footer}>
                    {step > 0 && (
                        <button onClick={anterior} style={s.btnSecundario}>← Atrás</button>
                    )}
                    <button
                        onClick={step === 0 ? () => aceptado && setStep(1) : siguiente}
                        disabled={guardando || (step === 0 && !aceptado)}
                        style={{
                            ...s.btnPrimario,
                            opacity: (step === 0 && !aceptado) || guardando ? 0.4 : 1,
                            cursor: (step === 0 && !aceptado) ? "not-allowed" : "pointer",
                            marginLeft: step === 0 ? "auto" : undefined,
                        }}
                    >
                        {guardando ? "Guardando..." : step === 7 ? "🎉 Crear mi perfil" : "Continuar →"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PantallaBienvenida({ aceptado, setAceptado }) {
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>⚽</div>
            <h1 style={{ color: C.grisOsc, fontSize: "21px", fontWeight: 800, marginBottom: "10px", lineHeight: 1.2 }}>
                ¡Bienvenido a la Polla CLTiene!
            </h1>
            <p style={{ color: C.grisOsc, fontSize: "14px", marginBottom: "20px", lineHeight: 1.6 }}>
                Predice los partidos del <strong style={{ color: C.naranja }}>Mundial 2026</strong>,
                acumula monedas y canjéalas por beneficios exclusivos.
            </p>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                background: `${C.dorado}18`, border: `1px solid ${C.dorado}40`,
                borderRadius: "12px", padding: "14px 20px", marginBottom: "20px",
            }}>
                <span style={{ fontSize: "28px" }}>🪙</span>
                <div>
                    <div style={{ color: C.dorado, fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>100</div>
                    <div style={{ color: C.grisOsc, fontSize: "12px" }}>monedas de bienvenida</div>
                </div>
            </div>
            <p style={{ color: C.grisOsc, fontSize: "13px", marginBottom: "16px" }}>
                No te tomará más de 1 minuto completar tu perfil.
            </p>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", textAlign: "left" }}>
                <input type="checkbox" checked={aceptado} onChange={(e) => setAceptado(e.target.checked)}
                    style={{ accentColor: C.naranja, width: "16px", height: "16px", marginTop: "2px", flexShrink: 0 }} />
                <span style={{ color: "#848588", fontSize: "14px" }}>
                    Acepto los <a href="#" style={{ color: C.naranja }}>términos y condiciones</a> y el
                    tratamiento de mis datos personales (Habeas Data)
                </span>
            </label>
        </div>
    );
}

function PantallaOpcion({ titulo, opciones, valor, onChange, error }) {
    return (
        <div>
            <h2 style={{ color: C.negro, fontSize: "17px", fontWeight: 700, marginBottom: "18px", lineHeight: 1.3 }}>
                {titulo}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {opciones.map((op) => (
                    <button key={op.valor} onClick={() => onChange(op.valor)} style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        padding: "13px 16px", border: "1.5px solid",
                        borderColor: valor === op.valor ? C.naranja : C.negro,
                        background: valor === op.valor ? `${C.naranja}18` : "rgba(255,255,255,0.03)",
                        color: valor === op.valor ? C.naranja : C.negro,
                        borderRadius: "12px", cursor: "pointer", textAlign: "left", width: "100%",
                        transition: "all 0.2s",
                    }}>
                        <span style={{ fontSize: "20px" }}>{op.icono}</span>
                        <span style={{ fontSize: "14px", fontWeight: valor === op.valor ? 700 : 400 }}>{op.label}</span>
                    </button>
                ))}
            </div>
            {error && <p style={{ color: C.rojo, fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        </div>
    );
}

function PantallaReferido({ valor, onChange, error }) {
    return (
        <div>
            <h2 style={{ color: C.negro, fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>
                ¿Eres referido de otro jugador CLTiene?
            </h2>
            <p style={{ color: C.grisClaro, fontSize: "14px", marginBottom: "22px" }}>
                Si alguien te invitó, ambos recibirán un bono de <strong style={{ color: C.dorado }}>50 monedas</strong> extra.
            </p>
            <div style={{ display: "flex", gap: "14px" }}>
                {[{ label: "Sí, soy referido", val: true, icono: "🤝" }, { label: "No, llegué solo", val: false, icono: "🔍" }].map((op) => (
                    <button key={String(op.val)} onClick={() => onChange(op.val)} style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                        padding: "18px 16px", border: "1.5px solid",
                        borderColor: valor === op.val ? C.naranja : "rgba(255,255,255,0.1)",
                        background: valor === op.val ? `${C.naranja}18` : "rgba(255,255,255,0.03)",
                        color: valor === op.val ? C.naranja : C.grisClaro,
                        borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                    }}>
                        <span style={{ fontSize: "26px" }}>{op.icono}</span>
                        <span style={{ fontSize: "14px", fontWeight: valor === op.val ? 700 : 400 }}>{op.label}</span>
                    </button>
                ))}
            </div>
            {error && <p style={{ color: C.rojo, fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        </div>
    );
}

function PantallaInput({ titulo, descripcion, placeholder, tipo = "text", valor, onChange, error }) {
    return (
        <div>
            <h2 style={{ color: C.negro, fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>{titulo}</h2>
            {descripcion && <p style={{ color: C.grisClaro, fontSize: "14px", marginBottom: "18px" }}>{descripcion}</p>}
            <input type={tipo} placeholder={placeholder} value={valor}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: "100%", padding: "13px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1.5px solid ${error ? C.rojo : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "12px", color: C.negro, fontSize: "15px",
                    outline: "none", boxSizing: "border-box",
                }}
                autoFocus />
            {error && <p style={{ color: C.rojo, fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        </div>
    );
}

function PantallaFinal({ nombre }) {
    return (
        <div style={s.root}>
            <div style={s.bgGradient} />
            <div style={s.bgNoise} />
            <div style={s.card}>
                <div style={{ textAlign: "center", padding: "28px 16px" }}>
                    <img src={logo} alt="CLTiene" style={{ width: "140px", height: "auto", display: "block", margin: "0 auto 8px" }} />
                    <div style={{ color: C.naranja, fontWeight: 700, fontSize: "13px", marginBottom: "20px" }}>Mundial 2026</div>
                    <div style={{ fontSize: "56px", marginBottom: "12px" }}>🏆</div>
                    <h1 style={{ color: C.blanco, fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
                        ¡Listo{nombre ? `, ${nombre}` : ""}!
                    </h1>
                    <p style={{ color: C.grisClaro, marginBottom: "20px", fontSize: "14px" }}>
                        Tu perfil de jugador ha sido creado.
                    </p>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                        background: `${C.dorado}18`, border: `1px solid ${C.dorado}40`,
                        borderRadius: "12px", padding: "14px 20px", marginBottom: "24px",
                    }}>
                        <span style={{ fontSize: "28px" }}>🪙</span>
                        <div>
                            <div style={{ color: C.dorado, fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>+100</div>
                            <div style={{ color: C.grisClaro, fontSize: "12px" }}>monedas CLTiene ganadas</div>
                        </div>
                    </div>
                    <p style={{ color: C.naranja, fontWeight: 700, fontSize: "18px", marginBottom: "20px" }}>
                        ¡Que empiece el Mundial!
                    </p>
                    <button
                        style={{ ...s.btnPrimario, width: "100%", marginLeft: 0 }}
                        onClick={() => window.location.href = "/dashboard"}
                    >
                        Ir a la Polla ⚽
                    </button>
                </div>
            </div>
        </div>
    );
}

const s = {
    root: {
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.negro, padding: "24px 16px", position: "relative",
        fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden",
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
    circulo1: {
        position: "absolute", width: "350px", height: "350px", borderRadius: "50%",
        border: "1px solid #FD775120", top: "-100px", right: "-100px", pointerEvents: "none",
    },
    circulo2: {
        position: "absolute", width: "250px", height: "250px", borderRadius: "50%",
        border: "1px solid #ECA82D15", bottom: "-80px", left: "-80px", pointerEvents: "none",
    },
    card: {
        position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px", width: "100%", maxWidth: "460px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
        overflow: "hidden",
    },
    header: {
        padding: "20px 24px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    progresoWrap: { display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" },
    progresoBar: { flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" },
    progresoFill: {
        height: "100%",
        background: `linear-gradient(90deg, ${C.naranja}, ${C.dorado})`,
        borderRadius: "2px", transition: "width 0.4s ease",
    },
    progresoText: { color: C.grisClaro, fontSize: "12px", whiteSpace: "nowrap" },
    body: { padding: "24px 24px" },
    footer: {
        padding: "16px 24px 24px", display: "flex", gap: "12px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
    },
    btnPrimario: {
        flex: 1, padding: "13px 20px",
        background: `linear-gradient(135deg, ${C.naranja}, #e5622a)`,
        color: C.blanco, border: "none", borderRadius: "12px",
        fontSize: "15px", fontWeight: 700, cursor: "pointer",
        boxShadow: `0 4px 16px ${C.naranja}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    btnSecundario: {
        padding: "13px 16px", background: "transparent",
        color: "#7D7765", border: "1.5px solid #262726",
        borderRadius: "12px", fontSize: "15px", cursor: "pointer",
    },
};
