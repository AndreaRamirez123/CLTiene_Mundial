import { useState, useEffect, useCallback } from 'react';

const PASOS = [
  {
    target: null,
    titulo: 'Bienvenido!',
    descripcion: 'Te explicamos rapidamente como funciona la plataforma. Vamos paso a paso.',
    icono: '🏆',
    posicion: 'center',
  },
  {
    target: '#tutorial-monedas',
    titulo: 'Tus monedas',
    descripcion: 'Aqui ves cuantas monedas tienes. Las ganas haciendo predicciones correctas, jugando trivia e invitando amigos.',
    icono: '🪙',
    posicion: 'bottom',
  },
  {
    target: '#tutorial-goles',
    titulo: 'Tus goles',
    descripcion: 'Los goles se ganan completando misiones. Acumula goles para desbloquear recompensas.',
    icono: '⚽',
    posicion: 'bottom',
  },
  {
    target: '#tutorial-stats',
    titulo: 'Tu progreso',
    descripcion: 'Monedas acumuladas, predicciones hechas y tu posicion en el ranking. Todo de un vistazo.',
    icono: '📊',
    posicion: 'bottom',
  },
  {
    target: '#tutorial-navbar',
    titulo: 'Navegacion',
    descripcion: 'Usa la barra inferior para moverte: Polla para predecir partidos, Misiones para ganar goles, Ranking para competir y Beneficios para canjear premios.',
    icono: '🧭',
    posicion: 'top',
    tab: null,
  },
  {
    target: null,
    titulo: 'Listo para jugar!',
    descripcion: 'Empieza prediciendo el resultado de un partido. Si aciertas el resultado ganas 50 monedas, si aciertas el marcador exacto ganas 100!',
    icono: '🎉',
    posicion: 'center',
    tab: 'polla',
  },
];

export default function TutorialDemo({ onTerminar, onIrA }) {
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState(null);
  const actual = PASOS[paso];

  const calcularRect = useCallback(() => {
    if (!actual.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(actual.target);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setRect(null);
    }
  }, [actual.target]);

  useEffect(() => {
    calcularRect();
    window.addEventListener('resize', calcularRect);
    return () => window.removeEventListener('resize', calcularRect);
  }, [calcularRect]);

  const irAPaso = (nuevo) => {
    setPaso(nuevo);
    if (PASOS[nuevo].tab && onIrA) onIrA(PASOS[nuevo].tab);
  };

  const siguiente = () => {
    if (paso >= PASOS.length - 1) onTerminar();
    else irAPaso(paso + 1);
  };

  const anterior = () => {
    if (paso > 0) irAPaso(paso - 1);
  };

  const pad = 8;

  // Posicion del tooltip
  const getTooltipStyle = () => {
    const base = {
      position: 'fixed', zIndex: 10001,
      background: 'linear-gradient(135deg, #1a1230 0%, #0d1a2e 100%)',
      borderRadius: 18, padding: '24px 22px', maxWidth: 340, width: '90%',
      boxShadow: '0 16px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
    };

    if (!rect || actual.posicion === 'center') {
      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    if (actual.posicion === 'bottom') {
      return {
        ...base,
        top: rect.top + rect.height + pad + 12,
        left: Math.max(16, Math.min(rect.left + rect.width / 2 - 170, window.innerWidth - 356)),
      };
    }

    // top
    return {
      ...base,
      bottom: window.innerHeight - rect.top + pad + 12,
      left: Math.max(16, Math.min(rect.left + rect.width / 2 - 170, window.innerWidth - 356)),
    };
  };

  return (
    <>
      {/* Overlay oscuro con hueco para el spotlight */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left - pad} y={rect.top - pad}
                  width={rect.width + pad * 2} height={rect.height + pad * 2}
                  rx="12" fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
        </svg>

        {/* Borde brillante alrededor del spotlight */}
        {rect && (
          <div style={{
            position: 'absolute',
            top: rect.top - pad, left: rect.left - pad,
            width: rect.width + pad * 2, height: rect.height + pad * 2,
            borderRadius: 12, border: '2px solid #FD7751',
            boxShadow: '0 0 20px rgba(253,119,81,0.4)',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </div>

      {/* Capa clickeable para bloquear interaccion */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={(e) => e.stopPropagation()} />

      {/* Tooltip */}
      <div style={getTooltipStyle()}>
        {/* Progreso */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {PASOS.map((_, i) => (
            <div key={i} style={{
              width: i === paso ? 20 : 7, height: 7, borderRadius: 10,
              background: i === paso ? '#FD7751' : i < paso ? '#16C784' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 40 }}>{actual.icono}</span>
          <div style={{ color: 'rgba(253,119,81,0.7)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginTop: 8 }}>
            {paso + 1} / {PASOS.length}
          </div>
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: '8px 0' }}>
            {actual.titulo}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
            {actual.descripcion}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {paso > 0 && (
            <button onClick={anterior} style={{
              flex: 1, padding: '11px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Anterior
            </button>
          )}
          <button onClick={siguiente} style={{
            flex: 2, padding: '11px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #FD7751, #ED1E28)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(253,119,81,0.4)',
          }}>
            {paso >= PASOS.length - 1 ? 'Empezar!' : 'Siguiente'}
          </button>
        </div>

        {paso < PASOS.length - 1 && (
          <button onClick={onTerminar} style={{
            display: 'block', margin: '12px auto 0', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer',
          }}>
            Saltar tutorial
          </button>
        )}
      </div>
    </>
  );
}
