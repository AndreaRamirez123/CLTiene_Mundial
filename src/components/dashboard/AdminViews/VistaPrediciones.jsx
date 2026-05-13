import { useState } from 'react';
import { C } from '../constants';

export default function VistaPrediciones({ predicciones, client }) {
  const [actualizando, setActualizando] = useState(false);
  const [logResultados, setLogResultados] = useState(null);

  const actualizarResultados = async () => {
    setActualizando(true);
    setLogResultados(null);
    try {
      const res = await client.post('/partidos/actualizar-resultados');
      setLogResultados(res.data);
    } catch (err) {
      setLogResultados({ mensaje: 'Error al actualizar: ' + (err.response?.data?.message || err.message) });
    } finally {
      setActualizando(false);
    }
  };

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
      {/* Botón actualizar resultados */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--texto)', margin: 0 }}>
          Predicciones sin validar ({predicciones.length})
        </h2>
        <button
          onClick={actualizarResultados}
          disabled={actualizando}
          style={{
            padding: '9px 16px', borderRadius: 10, border: 'none',
            background: actualizando ? 'rgba(22,199,132,0.1)' : 'rgba(22,199,132,0.2)',
            color: actualizando ? 'var(--texto-ter)' : C.verde,
            fontWeight: 700, fontSize: 13, cursor: actualizando ? 'wait' : 'pointer',
          }}
        >
          {actualizando ? '⏳ Buscando resultados...' : '🔄 Actualizar resultados ahora'}
        </button>
      </div>

      {/* Log de resultados */}
      {logResultados && (
        <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}>
          <div style={{ color: C.verde, fontWeight: 700, marginBottom: 6 }}>{logResultados.mensaje}</div>
          {logResultados.resultados?.map((r, i) => (
            <div key={i} style={{ color: 'var(--texto-sec)', marginTop: 3 }}>• {r}</div>
          ))}
        </div>
      )}

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
