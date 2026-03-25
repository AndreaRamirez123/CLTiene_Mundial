import { useState } from "react";
import client from "../api/client";
import { getLogoMarca, getNombreMarca, getSubtituloMarca } from "../utils/marca";
import Terminos from "./Terminos";

const C = {
    naranja: "var(--brand-primary)",
    dorado: "var(--brand-accent)",
    morado: "#822BD2",
    rosa: "#FC3276",
    azul: "#408DFF",
    rojo: "var(--brand-secondary)",
    grisClaro: "#999999",
    grisOsc: "#7D7765",
    blanco: "#ffffff",
    negro: "#1f2321",
};

export default function Registro({ usuario, onRegistroCompleto, onVolver }) {
    const [step, setStep] = useState(0);
    const [aceptado, setAceptado] = useState(false);
    const [verTerminos, setVerTerminos] = useState(false);

    
    const urlParams = new URLSearchParams(window.location.search);
    const codigoRefUrl = urlParams.get("ref") || "";

    const [form, setForm] = useState({
        tipojugador: "", relacionCLTiene: "", esReferido: codigoRefUrl ? true : null,
        nombreReferidor: "", codigoReferidor: codigoRefUrl, nombre: usuario?.googleNombre || "", telefono: "",
        departamento: "", ciudad: "",
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
        if (step === 6) {
            if (!form.telefono.trim()) {
                e.telefono = "Ingresa tu número";
            } else {
                const telLimpio = form.telefono.replace(/\D/g, "");
                if (!/^3\d{9}$/.test(telLimpio)) {
                    e.telefono = "Ingresa un celular colombiano válido (10 dígitos, ej: 300 123 4567)";
                }
            }
        }
        if (step === 7) {
            if (!form.departamento) e.departamento = "Selecciona tu departamento";
            if (!form.ciudad.trim() || form.ciudad === "__otra__") e.ciudad = "Selecciona o ingresa tu ciudad";
        }
        setErrores(e);
        return Object.keys(e).length === 0;
    };

    const guardarPerfil = async (datos) => {
        if (!usuario?.uid) return;
        setGuardando(true);
        try {
            const res = await client.post("/auth/completar-perfil", {
                uid: usuario.uid,
                nombre: datos.nombre,
                telefono: datos.telefono,
                tipojugador: datos.tipojugador,
                relacion_cltiene: datos.relacionCLTiene,
                es_referido: datos.esReferido ? 1 : 0,
                nombre_referidor: datos.nombreReferidor || "",
                referido_por: datos.codigoReferidor || "",
                departamento: datos.departamento || "",
                ciudad: datos.ciudad || "",
            });
            return res.data.usuario || true;
        } catch (err) {
            const msg = err.response?.data?.message || "Error al registrar";
            setErrores({ telefono: msg });
            return false;
        } finally {
            setGuardando(false);
        }
    };

    const siguiente = async () => {
        if (!validar()) return;
        if (step === 3 && form.esReferido === false) { setStep(5); return; }
        if (step === 7) {
            const resultado = await guardarPerfil(form);
            if (!resultado) return;
            setCompletado(true);
            if (onRegistroCompleto) onRegistroCompleto(typeof resultado === 'object' ? resultado : { ...form, monedas: 100 });
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
    if (verTerminos) return <Terminos onVolver={() => setVerTerminos(false)} />;

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
                        <img src={getLogoMarca()} alt={getNombreMarca()} style={{ width: "140px", height: "auto", display: "block", margin: "0 auto" }} />
                        <div style={{ color: C.naranja, fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>
                            {getSubtituloMarca()} ⚽
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
                    {step === 0 && <PantallaBienvenida aceptado={aceptado} setAceptado={setAceptado} setVerTerminos={setVerTerminos} />}
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
                        <div>
                            <PantallaInput
                                titulo="¿Quién te refirió?"
                                descripcion="Ingresa el nombre de quien te invitó para que reciba su bono de 50 monedas."
                                placeholder="Nombre del referidor"
                                valor={form.nombreReferidor}
                                onChange={(v) => set("nombreReferidor", v)}
                                error={errores.nombreReferidor}
                            />
                            {codigoRefUrl && (
                                <div style={{ marginTop: 12, padding: "10px 14px", background: `${C.dorado}18`, border: `1px solid ${C.dorado}40`, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>🎟️</span>
                                    <span style={{ color: C.dorado, fontSize: 13, fontWeight: 600 }}>Código de referido: {codigoRefUrl}</span>
                                </div>
                            )}
                        </div>
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
                        <PantallaUbicacion
                            departamento={form.departamento}
                            ciudad={form.ciudad}
                            onChangeDep={(v) => set("departamento", v)}
                            onChangeCiudad={(v) => set("ciudad", v)}
                            errorDep={errores.departamento}
                            errorCiudad={errores.ciudad}
                        />
                    )}
                </div>

                {/* Footer */}
                <div style={s.footer}>
                    {step === 0 && onVolver && (
                        <button onClick={onVolver} style={s.btnSecundario}>← Atrás</button>
                    )}
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
                        }}
                    >
                        {guardando ? "Guardando..." : step === 7 ? "🎉 Crear mi perfil" : "Continuar →"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PantallaBienvenida({ aceptado, setAceptado, setVerTerminos }) {
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
                    Acepto los <a href="#" onClick={(e) => { e.preventDefault(); setVerTerminos(true); }} style={{ color: C.naranja }}>términos y condiciones</a> y el
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

const CIUDADES_POR_DEPTO = {
    "Amazonas": ["Leticia", "Puerto Nariño"],
    "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Sabaneta", "La Ceja", "Rionegro", "Apartadó", "Turbo", "Caucasia"],
    "Arauca": ["Arauca", "Saravena", "Tame", "Fortul", "Arauquita"],
    "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Galapa", "Sabanalarga", "Puerto Colombia"],
    "Bogotá D.C.": ["Bogotá"],
    "Bolívar": ["Cartagena", "Turbaco", "Magangué", "El Carmen de Bolívar", "Arjona", "San Juan Nepomuceno"],
    "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Moniquirá"],
    "Caldas": ["Manizales", "Villamaría", "Chinchiná", "La Dorada", "Anserma", "Riosucio"],
    "Caquetá": ["Florencia", "San Vicente del Caguán", "El Doncello", "Puerto Rico", "Belén de los Andaquíes"],
    "Casanare": ["Yopal", "Aguazul", "Villanueva", "Monterrey", "Tauramena"],
    "Cauca": ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Piendamó", "Corinto", "Timbío"],
    "Cesar": ["Valledupar", "Aguachica", "Bosconia", "La Paz", "Codazzi", "Chimichagua"],
    "Chocó": ["Quibdó", "Istmina", "Condoto", "Tadó", "Riosucio"],
    "Córdoba": ["Montería", "Cereté", "Lorica", "Sahagún", "Planeta Rica", "Montelíbano"],
    "Cundinamarca": ["Soacha", "Fusagasugá", "Zipaquirá", "Facatativá", "Girardot", "Chía", "Mosquera", "Madrid"],
    "Guainía": ["Inírida"],
    "Guaviare": ["San José del Guaviare", "El Retorno", "Calamar"],
    "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre", "San Agustín"],
    "La Guajira": ["Riohacha", "Maicao", "Uribia", "Fonseca", "Barrancas", "San Juan del Cesar"],
    "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "Aracataca", "Plato", "El Banco"],
    "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López", "San Martín", "Restrepo"],
    "Nariño": ["Pasto", "Tumaco", "Ipiales", "Túquerres", "La Unión", "Samaniego"],
    "Norte de Santander": ["Cúcuta", "Los Patios", "Villa del Rosario", "Pamplona", "Ocaña", "Chinácota"],
    "Putumayo": ["Mocoa", "Puerto Asís", "Orito", "Sibundoy", "Valle del Guamuez"],
    "Quindío": ["Armenia", "Calarcá", "Montenegro", "La Tebaida", "Circasia", "Salento"],
    "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia", "Marsella"],
    "San Andrés y Providencia": ["San Andrés", "Providencia"],
    "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"],
    "Sucre": ["Sincelejo", "Corozal", "San Marcos", "Sampués", "Tolú", "Ovejas"],
    "Tolima": ["Ibagué", "Espinal", "Melgar", "Honda", "Chaparral", "Líbano"],
    "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga", "Jamundí", "Yumbo"],
    "Vaupés": ["Mitú", "Carurú"],
    "Vichada": ["Puerto Carreño", "La Primavera", "Santa Rosalía"],
};

const DEPARTAMENTOS = Object.keys(CIUDADES_POR_DEPTO);

function PantallaUbicacion({ departamento, ciudad, onChangeDep, onChangeCiudad, errorDep, errorCiudad }) {
    const ciudades = departamento ? CIUDADES_POR_DEPTO[departamento] || [] : [];
    const selectStyle = (valor, error) => ({
        width: "100%", padding: "13px 16px",
        background: "rgba(255, 255, 255, 0.05)",
        border: `1.5px solid ${error ? C.rojo : "rgba(255, 255, 255, 0.1)"}`,
        borderRadius: "12px", color: valor ? C.negro : C.grisClaro, fontSize: "15px",
        outline: "none", boxSizing: "border-box", marginBottom: "12px",
        cursor: "pointer",
    });

    return (
        <div>
            <h2 style={{ color: C.negro, fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>
                ¿De dónde eres?
            </h2>
            <p style={{ color: C.grisClaro, fontSize: "14px", marginBottom: "18px" }}>
                Queremos saber de qué parte de Colombia nos acompañan.
            </p>
            <select
                value={departamento}
                onChange={(e) => { onChangeDep(e.target.value); onChangeCiudad(""); }}
                style={selectStyle(departamento, errorDep)}
            >
                <option value="" disabled>Selecciona tu departamento</option>
                {DEPARTAMENTOS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                ))}
            </select>
            {errorDep && <p style={{ color: C.rojo, fontSize: "13px", marginTop: "-8px", marginBottom: "8px" }}>{errorDep}</p>}

            <select
                value={ciudad}
                onChange={(e) => onChangeCiudad(e.target.value)}
                disabled={!departamento}
                style={{ ...selectStyle(ciudad, errorCiudad), opacity: departamento ? 1 : 0.5, marginBottom: 0 }}
            >
                <option value="" disabled>{departamento ? "Selecciona tu ciudad" : "Primero selecciona departamento"}</option>
                {ciudades.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
                <option value="__otra__">Otra ciudad / municipio</option>
            </select>
            {ciudad === "__otra__" && (
                <input
                    type="text"
                    placeholder="Escribe tu ciudad o municipio"
                    onChange={(e) => onChangeCiudad(e.target.value)}
                    style={{
                        width: "100%", padding: "13px 16px", marginTop: "12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: `1.5px solid ${errorCiudad ? C.rojo : "rgba(255, 255, 255, 0.1)"}`,
                        borderRadius: "12px", color: C.negro, fontSize: "15px",
                        outline: "none", boxSizing: "border-box",
                    }}
                    autoFocus
                />
            )}
            {errorCiudad && <p style={{ color: C.rojo, fontSize: "13px", marginTop: "8px" }}>{errorCiudad}</p>}
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
                    <img src={getLogoMarca()} alt={getNombreMarca()} style={{ width: "140px", height: "auto", display: "block", margin: "0 auto 8px" }} />
                    <div style={{ color: C.naranja, fontWeight: 700, fontSize: "13px", marginBottom: "20px" }}>{getSubtituloMarca()}</div>
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
