import { getLogoMarca, getNombreMarca, leerConfigMarca } from "../utils/marca";

const C = { naranja: "var(--brand-primary)", morado: "#822BD2", dorado: "var(--brand-accent)" };

export default function Terminos({ onVolver }) {
  const config = leerConfigMarca();
  const nombreEmpresa = config?.nombre_app || "CLTiene Mundial";
  const textoPersonalizado = config?.terminos_condiciones;

  // Si la empresa tiene terminos personalizados, mostrar esos
  if (textoPersonalizado) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f0a1e 0%, #1a1035 100%)", color: "#fff" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(15,10,30,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(253,119,81,0.15)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onVolver} style={{ background: "rgba(253,119,81,0.1)", border: "1px solid rgba(253,119,81,0.3)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: C.naranja, fontSize: 18, cursor: "pointer" }}>
            ←
          </button>
          <img src={getLogoMarca()} alt={getNombreMarca()} style={{ height: 28 }} />
          <span style={{ fontWeight: 800, fontSize: 15 }}>Terminos y Condiciones</span>
        </div>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(253,119,81,0.12), rgba(130,43,210,0.12))", border: "1px solid rgba(253,119,81,0.2)", borderRadius: 16, padding: "24px 20px", marginBottom: 28, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Terminos y Condiciones</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{nombreEmpresa}</p>
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {textoPersonalizado}
          </div>
        </div>
      </div>
    );
  }

  // Terminos por defecto de CLTiene
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f0a1e 0%, #1a1035 100%)", color: "#fff" }}>
      {/* Header fijo */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(15,10,30,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(253,119,81,0.15)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onVolver} style={{ background: "rgba(253,119,81,0.1)", border: "1px solid rgba(253,119,81,0.3)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: C.naranja, fontSize: 18, cursor: "pointer" }}>
          ←
        </button>
        <img src={getLogoMarca()} alt={getNombreMarca()} style={{ height: 28 }} />
        <span style={{ fontWeight: 800, fontSize: 15 }}>Terminos y Condiciones</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, rgba(253,119,81,0.12), rgba(130,43,210,0.12))", border: "1px solid rgba(253,119,81,0.2)", borderRadius: 16, padding: "24px 20px", marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Términos y Condiciones</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            Polla CLTiene - Mundial 2026
          </p>
          <div style={{ display: "inline-block", marginTop: 10, background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "4px 14px" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Ultima actualizacion: Marzo 2026</span>
          </div>
        </div>

        {/* Secciones */}
        <Section icono="🎯" titulo="1. Objeto" color={C.naranja}>
          La aplicación <b style={{ color: C.naranja }}>CLTiene Mundial 2026</b> es una plataforma digital de interacción
          y gamificación diseñada para captar, conocer y fidelizar potenciales clientes de la empresa

          MULTISERVICIOS CL TIENE, aprovechando el Mundial de Futbol 2026.
          La App funciona como una <b>"polla deportiva con monedas virtuales"</b> donde los usuarios participan
          haciendo predicciones sobre partidos del torneo, <b>sin apostar dinero real</b>.
        </Section>

        <Section icono="🪙" titulo="2. Monedas Virtuales CLTiene" color={C.dorado}>
          <Item>Las monedas CLTiene son puntos virtuales que <b>solo existen dentro del ecosistema</b> de la App.</Item>
          <Item>No son convertibles en dinero real bajo ninguna circunstancia.</Item>
          <Item>Funcionan exclusivamente como puntos de fidelización y recompensa.</Item>
          <Item>No constituyen apuestas reales ni juegos de azar regulados.</Item>
          <Item>Las monedas se acumulan y <b>nunca se pierden</b> por participar en misiones o actividades.</Item>
          <Item>Al registrarse, cada usuario recibe <b style={{ color: C.dorado }}>100 monedas</b> de bienvenida.</Item>
        </Section>

        <Section icono="⚽" titulo="3. Predicciones" color="#16C784">
          <Item>Los usuarios pueden realizar predicciones <b>gratuitas</b> sobre los resultados de los partidos.</Item>
          <Item>Las predicciones no tienen costo en monedas.</Item>
          <Item>Si el usuario acierta el resultado (gana, empata, pierde), gana <b>+50 monedas</b>.</Item>
          <Item>Si el usuario acierta el marcador exacto, gana <b>+100 monedas adicionales</b>.</Item>
          <Item>Si el usuario no acierta, <b>no pierde monedas</b>.</Item>
          <Item>Las predicciones tienen un tiempo limite de edicion antes del inicio del partido.</Item>
        </Section>

        <Section icono="🎁" titulo="4. Sistema de Bonos" color={C.morado}>
          <BonusCard icono="📅" titulo="Bono diario" desc="Los usuarios reciben monedas por ingresar a la App cada día durante el Mundial." />
          <BonusCard icono="🏟️" titulo="Bono por participación" desc="Se otorgan monedas por realizar predicciones, independientemente del resultado." />
          <BonusCard icono="🎯" titulo="Misiones" desc="Actividades como ver videos, jugar trivia o invitar amigos que otorgan monedas y goles." />
        </Section>

        <Section icono="🏷️" titulo="5. Canje de Monedas" color={C.naranja}>
          <Item>Las monedas acumuladas podraán redimirse por beneficios reales de CLTiene <b>al finalizar el Mundial</b>.</Item>
          <Item>Los beneficios incluyen: descuentos en servicios, planes especiales, consultorías y beneficios exclusivos.</Item>
          <Item>Para canjear, el usuario debe cumplir al menos <b>una condición de participación activa</b>.</Item>
          <Item>Un asesor de CLTiene se pondrá en contacto con el usuario para activar su beneficio.</Item>
          <Item>CLTiene se reserva el derecho de modificar el catálogo de beneficios disponibles.</Item>
        </Section>

        <Section icono="🏆" titulo="6. Ranking" color={C.dorado}>
          <Item>El ranking se basa en las monedas acumuladas por cada jugador.</Item>
          <Item>La cantidad de monedas de cada jugador es información interna y no es visible para otros usuarios.</Item>
          <Item>El ranking incentiva la participación activa y la competencia sana.</Item>
        </Section>

        <Section icono="🔒" titulo="7. Tratamiento de Datos Personales" color="#408DFF" subtitulo="Habeas Data - Ley 1581 de 2012">
          <div style={{ background: "rgba(64,141,255,0.08)", border: "1px solid rgba(64,141,255,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>
              En cumplimiento de la <b>Ley 1581 de 2012</b> y el <b>Decreto 1377 de 2013</b>, CLTiene informa:
            </span>
          </div>
          <Item><b>Responsable:</b> MULTISERVICIOS CL TIENE.</Item>
          <Item><b>Finalidad:</b> Registro y gestión de la cuenta, personalización de la experiencia, comunicaciones relacionadas con la App, segmentación comercial y ofertas personalizadas.</Item>
          <Item><b>Derechos del titular:</b> El usuario tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos personales, así como revocar la autorización otorgada.</Item>
          <Item><b>Datos recopilados:</b> Nombre, correo electrónico, número de teléfono, tipo de perfil, relación con CLTiene y datos de uso de la App.</Item>
          <Item>La información recopilada en la encuesta inicial se percibe como parte del "perfil de jugador" y no como una encuesta comercial.</Item>
        </Section>

        <Section icono="©️" titulo="8. Propiedad Intelectual" color="rgba(255,255,255,0.5)">
          Todos los contenidos de la App, incluyendo pero no limitado a diseño, logotipos, textos, imágenes
          y código fuente, son propiedad de CLTiene o de sus licenciantes y están protegidos por las leyes
          de propiedad intelectual aplicables.
        </Section>

        <Section icono="⚖️" titulo="9. Limitación de Responsabilidad" color="rgba(255,255,255,0.5)">
          <Item>CLTiene no garantiza la disponibilidad continua e ininterrumpida de la App.</Item>
          <Item>La App <b>no constituye un juego de azar</b> ni una plataforma de apuestas reales.</Item>
          <Item>CLTiene no será responsable por daños derivados del uso o la imposibilidad de uso de la App.</Item>
          <Item>Las monedas virtuales <b>no tienen valor monetario real</b>.</Item>
        </Section>

        <Section icono="📝" titulo="10. Modificaciones" color="rgba(255,255,255,0.5)">
          CLTiene se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
          Los cambios serán notificados a los usuarios a través de la App. El uso continuado de la App
          despúes de la publicación de cambios constituye la aceptación de los mismos.
        </Section>

        <Section icono="🇨🇴" titulo="11. Legislación Aplicable" color="rgba(255,255,255,0.5)">
          Estos Términos y Condiciones se rigen por las leyes de la <b>República de Colombia</b>. Cualquier
          controversia será resuelta por los tribunales competentes de la ciudad de <b>Bogotá, Colombia</b>.
        </Section>

        {/* Banner importante */}
        <div style={{ marginTop: 32, background: "linear-gradient(135deg, rgba(253,119,81,0.1), rgba(237,30,40,0.08))", border: "1px solid rgba(253,119,81,0.25)", borderRadius: 16, padding: "20px 22px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 800, color: C.naranja, fontSize: 18, marginBottom: 6 }}>Importante</p>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
              Al registrarse y utilizar la App, el usuario declara que ha leído, entendido y aceptado estos
              Términos y Condiciones, así como la Política de Tratamiento de Datos Personales de CLTiene.
            </p>
          </div>
        </div>

        {/* Boton volver */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={onVolver} style={{
            padding: "14px 48px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(253,119,81,0.3)",
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
          <img src={getLogoMarca()} alt={getNombreMarca()} style={{ height: 32, opacity: 0.4 }} />
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 8 }}>
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
      <span style={{ color: "var(--brand-primary)", fontSize: 10, marginTop: 9, flexShrink: 0 }}>●</span>
      <span>{children}</span>
    </div>
  );
}

function BonusCard({ icono, titulo, desc }) {
  return (
    <div style={{ background: "rgba(130,43,210,0.08)", border: "1px solid rgba(130,43,210,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>{icono}</span>
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{titulo}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginTop: 3 }}>{desc}</div>
      </div>
    </div>
  );
}
