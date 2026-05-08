import { C } from '../constants';

export default function VistaPrediciones({ predicciones }) {
  const getResultadoColor = (prediccion) => {
    if (!prediccion.resultado) return 'var(--texto-sec)';
    if (prediccion.resultado === 'ganador') return C.verde;
    if (prediccion.resultado === 'perdedor') return C.naranja;
    return C.azul;
  };

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 14,
      padding: 20,
      border: `1px solid ${C.naranja}30`,
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--texto)' }}>
        Predicciones sin validar ({predicciones.length})
      </h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.naranja}40` }}>
              <th style={{ padding: '10px 8px', textAlign: 'left', color: C.naranja, fontWeight: 600 }}>Jugador</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', color: C.naranja, fontWeight: 600 }}>Partido</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Predicción</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Resultado</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Goles</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {predicciones.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: 20, textAlign: 'center', color: 'var(--texto-sec)' }}>
                  ✓ No hay predicciones sin validar
                </td>
              </tr>
            ) : (
              predicciones.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                  <td style={{ padding: '10px 8px', color: 'var(--texto)' }}>
                    {p.jugador?.nombre || p.jugador?.email?.split('@')[0] || 'Anónimo'}
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--texto)' }}>
                    {p.partido?.local_equipo} vs {p.partido?.visitante_equipo}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, color: C.azul }}>
                    {p.prediccion}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, color: getResultadoColor(p) }}>
                    {p.resultado || '—'}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: C.verde, fontWeight: 600 }}>
                    {p.goles_ganados || 0}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--texto-ter)', fontSize: 11 }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: 16,
        padding: 12,
        background: 'rgba(22,199,132,0.1)',
        borderRadius: 8,
        border: `1px solid ${C.verde}30`,
        fontSize: 12,
        color: C.verde,
        fontWeight: 600,
      }}>
        💡 Consejo: Las predicciones se validan automáticamente cuando se define el resultado del partido
      </div>
    </div>
  );
}
