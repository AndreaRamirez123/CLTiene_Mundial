import { useState } from 'react';
import { C } from '../constants';

export default function VistaUsuarios({ usuarios, client }) {
  const [detalleUid, setDetalleUid] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);

  const verDetalles = async (uid) => {
    setCargando(true);
    try {
      const res = await client.get(`/admin/jugadores/${uid}`);
      setDetalle(res.data);
      setDetalleUid(uid);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* Modal de detalle */}
      {detalleUid && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }} onClick={() => setDetalleUid(null)}>
          <div style={{
            background: '#1a1230',
            borderRadius: 14,
            padding: 28,
            border: `1px solid ${C.naranja}30`,
            maxHeight: '85vh',
            overflowY: 'auto',
            maxWidth: 550,
            width: '100%',
            boxShadow: '0 20px 80px rgba(0,0,0,0.9)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--texto)', margin: 0 }}>
                🎯 {detalle?.jugador?.nombre || detalle?.jugador?.email || 'Jugador'}
              </h3>
              <button
                onClick={() => setDetalleUid(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--texto)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                ✕
              </button>
            </div>

            {detalle && (
              <>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <div style={{ background: 'rgba(253,119,81,0.1)', padding: 14, borderRadius: 10, border: `1px solid ${C.naranja}40` }}>
                    <div style={{ color: 'var(--texto-sec)', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>MONEDAS TOTALES</div>
                    <div style={{ color: C.naranja, fontSize: 28, fontWeight: 900 }}>{detalle.monedas_totales_ganadas || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(22,199,132,0.1)', padding: 14, borderRadius: 10, border: `1px solid ${C.verde}40` }}>
                    <div style={{ color: 'var(--texto-sec)', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>PREDICCIONES ACERTADAS</div>
                    <div style={{ color: C.verde, fontSize: 28, fontWeight: 900 }}>{detalle.predicciones_acertadas || 0}</div>
                  </div>
                </div>

                {/* Transacciones */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: C.naranja, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    📊 Movimientos Recientes
                  </h4>
                  <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 10,
                    maxHeight: 220,
                    overflowY: 'auto',
                    border: `1px solid rgba(255,255,255,0.08)`,
                  }}>
                    {detalle.transacciones && detalle.transacciones.length > 0 ? (
                      detalle.transacciones.slice(0, 6).map((t, i) => (
                        <div key={i} style={{
                          padding: '12px 14px',
                          borderBottom: i < detalle.transacciones.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          fontSize: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ color: 'var(--texto)', fontWeight: 600, marginBottom: 3 }}>{t.tipo}</div>
                            <div style={{ color: 'var(--texto-ter)', fontSize: 10 }}>{new Date(t.created_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{
                            color: t.monto > 0 ? C.verde : C.naranja,
                            fontWeight: 700,
                            fontSize: 13,
                          }}>
                            {t.monto > 0 ? '+' : ''}{t.monto} 🪙
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 14, textAlign: 'center', color: 'var(--texto-ter)' }}>
                        No hay movimientos
                      </div>
                    )}
                  </div>
                </div>

                {/* Info adicional */}
                <div style={{ fontSize: 11, color: 'var(--texto-ter)', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, wordBreak: 'break-all', border: `1px solid rgba(255,255,255,0.06)` }}>
                  <strong>UID:</strong> {detalle.jugador.uid}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div style={{
        background: 'var(--card)',
        borderRadius: 14,
        padding: 20,
        border: `1px solid ${C.naranja}30`,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--texto)' }}>
          Todos los Usuarios
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.naranja}40` }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: C.naranja, fontWeight: 600 }}>Email</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: C.naranja, fontWeight: 600 }}>Empresa</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Monedas</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Predicciones</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Goles</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Rol</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.05)`, transition: 'background 0.2s' }}>
                  <td style={{ padding: '10px 8px', color: 'var(--texto)' }}>{u.email}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--texto-sec)', fontSize: 12 }}>{u.empresa?.nombre || '—'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: C.dorado, fontWeight: 600 }}>{u.monedas}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--texto-sec)' }}>{u.predicciones_count || 0}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: C.verde, fontWeight: 600 }}>{u.goles || 0}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{
                      background: u.rol === 'admin' ? `${C.naranja}20` : 'rgba(255,255,255,0.05)',
                      color: u.rol === 'admin' ? C.naranja : 'var(--texto-sec)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {u.rol === 'admin' ? '🛡️ Admin' : 'Jugador'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => verDetalles(u.uid)}
                      style={{
                        background: C.verde,
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      👁️ Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
