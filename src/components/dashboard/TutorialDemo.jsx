import { useState, useEffect, useRef } from 'react';

const PASOS = [
  {
    target: null,
    titulo: 'Bienvenido!',
    descripcion: 'Te explicamos rapidamente como funciona la plataforma. Vamos paso a paso.',
    icono: '🏆',
  },
  {
    target: '#tutorial-monedas',
    titulo: 'Tus monedas',
    descripcion: 'Aqui ves cuantas monedas tienes. Las ganas haciendo predicciones correctas, jugando trivia e invitando amigos.',
    icono: '🪙',
  },
  {
    target: '#tutorial-goles',
    titulo: 'Tus goles',
    descripcion: 'Los goles se ganan completando misiones. Acumula goles para desbloquear recompensas.',
    icono: '⚽',
  },

  {
    target: '#tutorial-tema',
    titulo: 'Tema oscuro/claro',
    descripcion: 'Activa el modo oscuro para una experiencia más cómoda en ambientes con poca luz, o el modo claro para un aspecto más brillante.',
    icono: '🌗',
  },
  {
    target: '#tutorial-stats',
    titulo: 'Tu progreso',
    descripcion: 'Monedas acumuladas, predicciones hechas y tu posicion en el ranking. Todo de un vistazo.',
    icono: '📊',
  },
  {
    target: 'navbar-auto',
    titulo: 'Navegacion',
    descripcion: 'Usa la barra inferior para moverte: Predicciones para predecir partidos, Misiones para ganar goles, Ranking para competir y Beneficios para canjear premios.',
    icono: '🧭',
  },
  {
    target: null,
    titulo: 'Listo para jugar!',
    descripcion: 'Empieza prediciendo el resultado de un partido. Si aciertas el resultado ganas 50 monedas, si aciertas el marcador exacto ganas 100!',
    icono: '🎉',
  },
];

export default function TutorialDemo({ onTerminar }) {
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);
  const actual = PASOS[paso];
  const esNavbar = actual.target === 'navbar-auto';
  const pad = esNavbar ? 0 : 8;
  const getNavbarFallbackRect = () => {
    const height = 64;
    return { top: window.innerHeight - height, left: 0, width: window.innerWidth, height };
  };

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Al cambiar de paso, scrollear al elemento y calcular rect en loop
  useEffect(() => {
    if (!actual.target) {
      setRect(null);
      return;
    }

    // navbar-auto: detectar cual barra es visible (desktop o mobile)
    let el;
    if (actual.target === 'navbar-auto') {
      const hitbox = document.getElementById('tutorial-navbar-hitbox');
      if (hitbox) {
        el = hitbox;
      } else {
        const mobile = document.getElementById('tutorial-navbar-mobile');
        const desktop = document.getElementById('tutorial-navbar');
        const candidatos = [mobile, desktop].filter(Boolean);
        const visibles = candidatos.filter((c) => {
          const style = window.getComputedStyle(c);
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
          const r = c.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        const lista = visibles.length ? visibles : candidatos;
        let mejor = null;
        let mejorArea = 0;
        lista.forEach((c) => {
          const r = c.getBoundingClientRect();
          const area = r.width * r.height;
          if (area > mejorArea) {
            mejor = c;
            mejorArea = area;
          }
        });
        el = mejor;
      }
    } else {
      el = document.querySelector(actual.target);
    }
    if (!el) {
      if (actual.target === 'navbar-auto') {
        setRect(getNavbarFallbackRect());
      } else {
        setRect(null);
      }
      return;
    }

    // Subir z-index del elemento para que se vea sobre el overlay
    const originalZIndex = el.style.zIndex;
    el.style.zIndex = '10002';

    // Scrollear al elemento (no para elementos fixed)
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      if (actual.target === 'navbar-auto') {
        setRect(getNavbarFallbackRect());
      } else {
        setRect(null);
      }
      return;
    }
    if (style.position !== 'fixed') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Actualizar rect continuamente (para elementos fixed como navbar)
    const actualizar = () => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        if (actual.target === 'navbar-auto') {
          setRect(getNavbarFallbackRect());
        } else {
          setRect(null);
        }
      } else {
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
      rafRef.current = requestAnimationFrame(actualizar);
    };

    // Esperar a que termine el scroll
    setTimeout(() => { actualizar(); }, 350);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      el.style.zIndex = originalZIndex || '';
    };
  }, [paso, actual.target]);

  const siguiente = () => {
    if (paso >= PASOS.length - 1) onTerminar();
    else setPaso(paso + 1);
  };

  const anterior = () => {
    if (paso > 0) setPaso(paso - 1);
  };

  // Tooltip siempre centrado horizontalmente, posicion vertical segun el elemento
  const getTooltipStyle = () => {
    const base = {
      position: 'fixed', zIndex: 10001,
      background: 'linear-gradient(135deg, #1a1230 0%, #0d1a2e 100%)',
      borderRadius: 18, padding: '20px 18px', maxWidth: 340,
      width: 'calc(100% - 32px)',
      left: '50%', transform: 'translateX(-50%)',
      boxShadow: '0 16px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
    };

    // Sin target o sin rect: centrar
    if (!rect) {
      return { ...base, top: '50%', transform: 'translate(-50%, -50%)' };
    }

    // Si el elemento esta en la mitad superior, tooltip va abajo
    const elCenter = rect.top + rect.height / 2;
    if (elCenter < window.innerHeight / 2) {
      return { ...base, top: Math.min(rect.top + rect.height + pad + 12, window.innerHeight - 280) };
    }

    // Si el elemento esta en la mitad inferior, tooltip va arriba
    return { ...base, bottom: Math.min(window.innerHeight - rect.top + pad + 8, window.innerHeight - 100) };
  };

  return (
    <>
      {/* Overlay con spotlight */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left - pad} y={rect.top - pad}
                  width={rect.width + pad * 2} height={rect.height + pad * 2}
                  rx={esNavbar ? "14" : "12"} fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
        </svg>

      </div>

      {/* Borde naranja del spotlight - z-index alto para cubrir navbar */}
      {rect && (
        <div style={{
          position: 'fixed', zIndex: 10003, pointerEvents: 'none',
          top: rect.top - pad, left: rect.left - pad,
          width: rect.width + pad * 2, height: rect.height + pad * 2,
          borderRadius: esNavbar ? 14 : 12,
          border: esNavbar ? '3px solid rgba(253,119,81,0.98)' : '3px solid #FD7751',
          background: esNavbar ? 'rgba(253,119,81,0.12)' : 'transparent',
          boxShadow: esNavbar
            ? '0 0 18px rgba(253,119,81,0.6), 0 0 36px rgba(253,119,81,0.3)'
            : '0 0 24px rgba(253,119,81,0.5), inset 0 0 12px rgba(253,119,81,0.15)',
          animation: 'pulse 2s infinite',
        }} />
      )}

      {/* Bloquear clicks */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} />

      {/* Tooltip */}
      <div style={getTooltipStyle()}>
        {/* Progreso */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 16 }}>
          {PASOS.map((_, i) => (
            <div key={i} style={{
              width: i === paso ? 20 : 7, height: 7, borderRadius: 10,
              background: i === paso ? '#FD7751' : i < paso ? '#16C784' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 36 }}>{actual.icono}</span>
          <div style={{ color: 'rgba(253,119,81,0.7)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginTop: 6 }}>
            {paso + 1} / {PASOS.length}
          </div>
          <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 900, margin: '6px 0' }}>
            {actual.titulo}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
            {actual.descripcion}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {paso > 0 && (
            <button onClick={anterior} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Anterior
            </button>
          )}
          <button onClick={siguiente} style={{
            flex: 2, padding: '10px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #FD7751, #ED1E28)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(253,119,81,0.4)',
          }}>
            {paso >= PASOS.length - 1 ? 'Empezar!' : 'Siguiente'}
          </button>
        </div>

        {paso < PASOS.length - 1 && (
          <button onClick={onTerminar} style={{
            display: 'block', margin: '10px auto 0', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer',
          }}>
            Saltar tutorial
          </button>
        )}
      </div>
    </>
  );
}
