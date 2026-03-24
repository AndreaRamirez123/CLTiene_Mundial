import { C } from '../constants';

export default function VistaEstadisticas({ estadisticas }) {
  if (!estadisticas) {
    return <div style={{ color: 'var(--texto-sec)' }}>Cargando estadísticas...</div>;
  }

  const cards = [
    {
      label: 'Total Jugadores',
      valor: estadisticas.total_jugadores,
      icono: '👥',
      color: C.azul,
      bg: 'rgba(64,141,255,0.1)',
    },
    {
      label: 'Total Predicciones',
      valor: estadisticas.total_predicciones,
      icono: '🎯',
      color: C.naranja,
      bg: 'rgba(253,119,81,0.1)',
    },
    {
      label: 'Monedas en Circulación',
      valor: estadisticas.total_monedas_en_circulacion.toLocaleString(),
      icono: '🪙',
      color: C.dorado,
      bg: 'rgba(236,168,45,0.1)',
    },
    {
      label: 'Administradores',
      valor: estadisticas.admins,
      icono: '🛡️',
      color: C.verde,
      bg: 'rgba(22,199,132,0.1)',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            background: card.bg,
            border: `2px solid ${card.color}40`,
            borderRadius: 14,
            padding: 24,
            textAlign: 'center',
            transition: 'all 0.3s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = `0 12px 30px ${card.color}30`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>{card.icono}</div>
          <div style={{ color: 'var(--texto-sec)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            {card.label}
          </div>
          <div style={{ color: card.color, fontSize: 32, fontWeight: 900 }}>
            {card.valor}
          </div>
        </div>
      ))}

      {/* Información adicional */}
      <div
        style={{
          gridColumn: 'span 2',
          background: `linear-gradient(135deg, ${C.naranja}15, ${C.verde}15)`,
          borderRadius: 14,
          padding: 24,
          border: `1px solid ${C.naranja}40`,
        }}
      >
        <h3 style={{ color: 'var(--texto)', marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
          📋 Resumen del Sistema
        </h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
            <span style={{ color: 'var(--texto-sec)' }}>PPM (Predicciones por Jugador)</span>
            <span style={{ color: C.naranja, fontWeight: 700 }}>
              {(estadisticas.total_predicciones / estadisticas.total_jugadores).toFixed(1)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
            <span style={{ color: 'var(--texto-sec)' }}>Monedas Promedio por Jugador</span>
            <span style={{ color: C.dorado, fontWeight: 700 }}>
              {Math.round(estadisticas.total_monedas_en_circulacion / estadisticas.total_jugadores)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--texto-sec)' }}>Última Actualización</span>
            <span style={{ color: C.verde, fontWeight: 700 }}>
              {new Date(estadisticas.fecha).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div
        style={{
          gridColumn: 'span 2',
          background: 'rgba(64,141,255,0.1)',
          borderRadius: 14,
          padding: 16,
          border: `1px solid ${C.azul}40`,
          fontSize: 12,
          color: C.azul,
        }}
      >
        💡 <strong>Tip:</strong> Estas estadísticas se actualizan en tiempo real. El sistema cuenta automáticamente todos los jugadores, predicciones y monedas activas.
      </div>
    </div>
  );
}
