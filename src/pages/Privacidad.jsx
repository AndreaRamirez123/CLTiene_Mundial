import logo from "../assets/logo.png";

const C = { naranja: "#FD7751", morado: "#822BD2", azul: "#408DFF" };

export default function Privacidad({ onVolver }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f0a1e 0%, #1a1035 100%)", color: "#fff" }}>
      {/* Header fijo */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(15,10,30,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(64,141,255,0.15)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onVolver} style={{ background: "rgba(64,141,255,0.1)", border: "1px solid rgba(64,141,255,0.3)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: C.azul, fontSize: 18, cursor: "pointer" }}>
          ←
        </button>
        <img src={logo} alt="CLTiene" style={{ height: 28 }} />
        <span style={{ fontWeight: 800, fontSize: 15 }}>Política de Privacidad</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, rgba(64,141,255,0.12), rgba(130,43,210,0.12))", border: "1px solid rgba(64,141,255,0.2)", borderRadius: 16, padding: "24px 20px", marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Política de Privacidad</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Protección de Datos Personales - CLTiene Mundial 2026
          </p>
          <div style={{ display: "inline-block", marginTop: 10, background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "4px 14px" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Última actualización: Marzo 2026</span>
          </div>
        </div>

        {/* Secciones */}
        <Section icono="🏢" titulo="1. Responsable del Tratamiento" color={C.azul}>
          <Item><b>Empresa:</b> MULTISERVICIOS CL TIENE</Item>
          <Item><b>Aplicación:</b> Polla CLTiene - Mundial 2026</Item>
          <Item>CLTiene actúa como responsable del tratamiento de los datos personales recopilados a través de la aplicación.</Item>
        </Section>

        <Section icono="📋" titulo="2. Datos que Recopilamos" color={C.naranja}>
          <SubTitle>Datos proporcionados por el usuario:</SubTitle>
          <Item>Nombre completo</Item>
          <Item>Correo electrónico</Item>
          <Item>Número de teléfono</Item>
          <Item>Tipo de perfil (persona natural, empresa, organización)</Item>
          <Item>Relación con CLTiene (cliente, explorador, nuevo)</Item>
          <Item>Información de referidos</Item>

          <SubTitle>Datos generados por el uso de la App:</SubTitle>
          <Item>Predicciones realizadas</Item>
          <Item>Monedas acumuladas y transacciones</Item>
          <Item>Historial de trivias jugadas</Item>
          <Item>Frecuencia de uso y último acceso</Item>
          <Item>Nivel de actividad (activo, inactivo)</Item>
          <Item>Misiones completadas</Item>
        </Section>

        <Section icono="🎯" titulo="3. Finalidad del Tratamiento" color={C.morado}>
          <Item>Registro y gestión de la cuenta del usuario en la App.</Item>
          <Item>Personalización de la experiencia de juego.</Item>
          <Item>Envío de notificaciones relacionadas con partidos y predicciones.</Item>
          <Item>Gestión del sistema de monedas, ranking y beneficios.</Item>
          <Item>Segmentación comercial para ofertas personalizadas de CLTiene.</Item>
          <Item>Comunicaciones comerciales sobre productos y servicios de CLTiene.</Item>
          <Item>Análisis estadístico del comportamiento de los usuarios.</Item>
          <Item>Cumplimiento de obligaciones legales.</Item>
        </Section>

        <Section icono="⚖️" titulo="4. Base Legal" color={C.azul}>
          El tratamiento de datos personales se realiza con fundamento en:
          <div style={{ marginTop: 10 }}>
            <LawCard ley="Ley 1581 de 2012" desc="Régimen General de Protección de Datos Personales en Colombia." />
            <LawCard ley="Decreto 1377 de 2013" desc="Reglamenta parcialmente la Ley 1581 de 2012." />
            <LawCard ley="Autorización del titular" desc="Otorgada al momento del registro en la aplicación mediante la aceptación de los Términos y Condiciones." />
          </div>
        </Section>

        <Section icono="👤" titulo="5. Derechos del Titular" color="#16C784">
          Como titular de datos personales, usted tiene derecho a:
          <div style={{ marginTop: 10 }}>
            <Item><b>Conocer:</b> Acceder a sus datos personales que han sido objeto de tratamiento.</Item>
            <Item><b>Actualizar:</b> Solicitar la actualización de sus datos cuando estén incompletos o inexactos.</Item>
            <Item><b>Rectificar:</b> Corregir la información y los datos personales que resulten inexactos.</Item>
            <Item><b>Suprimir:</b> Solicitar la eliminación de sus datos cuando no sean necesarios para la finalidad autorizada.</Item>
            <Item><b>Revocar:</b> Revocar la autorización otorgada para el tratamiento de sus datos personales.</Item>
            <Item><b>Presentar quejas:</b> Ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</Item>
          </div>
        </Section>

        <Section icono="📧" titulo="6. Ejercicio de Derechos" color={C.naranja}>
          Para ejercer sus derechos como titular de datos personales, puede comunicarse a través de:
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <ContactCard icono="📧" tipo="Correo electrónico" valor="privacidad@cltiene.com" />
            <ContactCard icono="📱" tipo="WhatsApp" valor="Línea de atención CLTiene" />
          </div>
          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.5)", fontSize: 15 }}>
            CLTiene dará respuesta a su solicitud en un plazo máximo de <b>quince (15) días hábiles</b> contados
            a partir de la fecha de recibo de la solicitud.
          </div>
        </Section>

        <Section icono="🔐" titulo="7. Seguridad de los Datos" color={C.morado}>
          <Item>CLTiene implementa medidas técnicas, humanas y administrativas para proteger los datos personales.</Item>
          <Item>Los datos se almacenan en servidores seguros con cifrado y acceso restringido.</Item>
          <Item>La autenticación se realiza mediante Firebase Authentication de Google.</Item>
          <Item>Se realizan respaldos periódicos de la información.</Item>
          <Item>El acceso a los datos está limitado al personal autorizado.</Item>
        </Section>

        <Section icono="🤝" titulo="8. Compartición de Datos" color={C.azul}>
          CLTiene <b>no vende ni comparte</b> datos personales con terceros, excepto en los siguientes casos:
          <div style={{ marginTop: 10 }}>
            <Item>Proveedores de servicios tecnológicos necesarios para el funcionamiento de la App (Firebase, servidores).</Item>
            <Item>Cuando sea requerido por autoridad judicial o administrativa competente.</Item>
            <Item>Para la gestión de beneficios canjeados (contacto con asesores CLTiene).</Item>
          </div>
        </Section>

        <Section icono="⏰" titulo="9. Vigencia y Almacenamiento" color="rgba(255,255,255,0.5)">
          <Item>Los datos personales serán almacenados durante la vigencia de la aplicación y el Mundial 2026.</Item>
          <Item>Posterior al evento, los datos se conservarán por un período máximo de <b>un (1) año</b> para fines de análisis y entrega de beneficios.</Item>
          <Item>Transcurrido este período, los datos serán eliminados de forma segura, salvo obligación legal de conservación.</Item>
        </Section>

        <Section icono="🍪" titulo="10. Cookies y Tecnologías Similares" color="rgba(255,255,255,0.5)">
          <Item>La App utiliza cookies y almacenamiento local para mantener la sesión del usuario activa.</Item>
          <Item>Se utilizan tokens de notificación (FCM) para el envío de notificaciones push.</Item>
          <Item>No se utilizan cookies de rastreo de terceros con fines publicitarios.</Item>
        </Section>

        <Section icono="📝" titulo="11. Modificaciones" color="rgba(255,255,255,0.5)">
          CLTiene se reserva el derecho de modificar esta Política de Privacidad. Los cambios serán
          notificados a través de la App. El uso continuado después de las modificaciones constituye
          la aceptación de la nueva política.
        </Section>

        {/* Banner importante */}
        <div style={{ marginTop: 32, background: "linear-gradient(135deg, rgba(64,141,255,0.1), rgba(130,43,210,0.08))", border: "1px solid rgba(64,141,255,0.25)", borderRadius: 16, padding: "20px 22px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🛡️</span>
          <div>
            <p style={{ fontWeight: 800, color: C.azul, fontSize: 18, marginBottom: 6 }}>Compromiso CLTiene</p>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
              En CLTiene nos comprometemos a proteger tu información personal y a utilizarla
              únicamente para brindarte la mejor experiencia durante el Mundial 2026.
              Tu confianza es nuestra prioridad.
            </p>
          </div>
        </div>

        {/* Boton volver */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={onVolver} style={{
            padding: "14px 48px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #408DFF, #822BD2)",
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(64,141,255,0.3)",
            transition: "transform 0.2s",
          }}
            onMouseEnter={e => e.target.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          >
            ← Volver
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <img src={logo} alt="CLTiene" style={{ height: 32, opacity: 0.4 }} />
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 8 }}>
            MULTISERVICIOS CL TIENE - Todos los derechos reservados 2026
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ icono, titulo, subtitulo, color, children }) {
  return (
    <div style={{ marginBottom: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "18px 20px", borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icono}</span>
        <div>
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>{titulo}</h3>
          {subtitulo && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{subtitulo}</span>}
        </div>
      </div>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 2 }}>
        {children}
      </div>
    </div>
  );
}

function Item({ children }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
      <span style={{ color: "#408DFF", fontSize: 10, marginTop: 9, flexShrink: 0 }}>●</span>
      <span>{children}</span>
    </div>
  );
}

function SubTitle({ children }) {
  return (
    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 700, marginTop: 14, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </div>
  );
}

function LawCard({ ley, desc }) {
  return (
    <div style={{ background: "rgba(64,141,255,0.06)", border: "1px solid rgba(64,141,255,0.12)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>📜</span>
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{ley}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

function ContactCard({ icono, tipo, valor }) {
  return (
    <div style={{ background: "rgba(253,119,81,0.06)", border: "1px solid rgba(253,119,81,0.12)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ fontSize: 20 }}>{icono}</span>
      <div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{tipo}</div>
        <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{valor}</div>
      </div>
    </div>
  );
}
