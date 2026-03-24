import { useState } from 'react';
import { C } from '../../constants';

export default function VistaUsuarios({ usuarios, client, usuario }) {
  const [detalleUid, setDetalleUid] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);

  const verDetalles = async (uid) => {
    setCargando(true);
    try {
      const headers = { 'x-user-uid': usuario.uid };
      const res = await client.get(`/admin/jugadores/${uid}`, { headers });
      setDetalle(res.data);
      setDetalleUid(uid);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: detalleUid ? '1fr 1fr' : '1fr', gap: 20 }}>
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

      {/* Detalle de usuario */}
      {detalleUid && detalle && (
        <div style={{
          background: 'var(--card)',
          borderRadius: 14,
          padding: 20,
          border: `1px solid ${C.verde}30`,
          maxHeight: '70vh',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--texto)' }}>
              Detalle: {detalle.jugador.nombre || detalle.jugador.email}
            </h3>
            <button
              onClick={() => setDetalleUid(null)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'var(--texto)',
                border: 'none',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'rgba(253,119,81,0.1)', padding: 12, borderRadius: 8, border: `1px solid ${C.naranja}30` }}>
              <div style={{ color: 'var(--texto-sec)', fontSize: 11, fontWeight: 600 }}>MONEDAS TOTALES</div>
              <div style={{ color: C.naranja, fontSize: 24, fontWeight: 900 }}>{detalle.monedas_totales_ganadas}</div>
            </div>
            <div style={{ background: 'rgba(22,199,132,0.1)', padding: 12, borderRadius: 8, border: `1px solid ${C.verde}30` }}>
              <div style={{ color: 'var(--texto-sec)', fontSize: 11, fontWeight: 600 }}>PREDICCIONES ACERTADAS</div>
              <div style={{ color: C.verde, fontSize: 24, fontWeight: 900 }}>{detalle.predicciones_acertadas}</div>
            </div>
          </div>

          {/* Transacciones */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: C.naranja, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Último Movimiento de Monedas
            </h4>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {detalle.transacciones.slice(0, 5).map((t, i) => (
                <div key={i} style={{
                  padding: 10,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: 11,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ color: 'var(--texto)', fontWeight: 600 }}>{t.tipo}</div>
                    <div style={{ color: 'var(--texto-ter)', fontSize: 10 }}>{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ 
                    color: t.monto > 0 ? C.verde : C.naranja,
                    fontWeight: 700,
                  }}>
                    {t.monto > 0 ? '+' : ''}{t.monto}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UID */}
          <div style={{ fontSize: 10, color: 'var(--texto-ter)', padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6, wordBreak: 'break-all' }}>
            <strong>UID:</strong> {detalle.jugador.uid}
          </div>
        </div>
      )}
    </div>
  );
}
