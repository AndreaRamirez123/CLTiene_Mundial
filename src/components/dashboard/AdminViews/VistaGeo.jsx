import { useState, useEffect } from 'react';
import { C } from '../constants';

export default function VistaGeo({ client }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('departamento');

  useEffect(() => {
    client.get('/admin/georreferenciacion')
      .then((res) => setDatos(res.data))
      .catch((err) => console.error('Error geo:', err))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div style={{ textAlign: 'center', color: 'var(--texto-ter)', padding: 40 }}>Cargando datos...</div>;
  if (!datos) return <div style={{ textAlign: 'center', color: 'var(--texto-ter)', padding: 40 }}>Sin datos disponibles</div>;

  const maxCantidad = datos.por_departamento.length > 0
    ? Math.max(...datos.por_departamento.map(d => parseInt(d.cantidad)))
    : 1;

  const lista = vistaActiva === 'departamento' ? datos.por_departamento : datos.por_ciudad;

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(253,119,81,0.1)', padding: 16, borderRadius: 12, border: `1px solid ${C.naranja}40`, textAlign: 'center' }}>
          <div style={{ color: 'var(--texto-sec)', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>CON UBICACIÓN</div>
          <div style={{ color: C.naranja, fontSize: 28, fontWeight: 900 }}>{datos.total_con_ubicacion}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <div style={{ color: 'var(--texto-sec)', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>SIN UBICACIÓN</div>
          <div style={{ color: 'var(--texto-ter)', fontSize: 28, fontWeight: 900 }}>{datos.total_sin_ubicacion}</div>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'departamento', label: 'Por departamento' },
          { id: 'ciudad', label: 'Por ciudad' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setVistaActiva(t.id)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, border: 'none',
              background: vistaActiva === t.id ? C.naranja : 'rgba(255,255,255,0.06)',
              color: vistaActiva === t.id ? '#fff' : 'var(--texto-sec)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Barras */}
      <div style={{
        background: 'var(--card)', borderRadius: 14, padding: 16,
        border: '1px solid var(--card-border)', maxHeight: 500, overflowY: 'auto',
      }}>
        {lista.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--texto-ter)', padding: 30, fontSize: 13 }}>
            Aún no hay datos de ubicación registrados
          </div>
        ) : (
          lista.map((item, i) => {
            const nombre = vistaActiva === 'departamento'
              ? item.departamento
              : `${item.ciudad}, ${item.departamento}`;
            const cantidad = parseInt(item.cantidad);
            const porcentaje = (cantidad / maxCantidad) * 100;

            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--texto)', fontSize: 13, fontWeight: 600 }}>
                    {i + 1}. {nombre || 'Sin definir'}
                  </span>
                  <span style={{ color: C.naranja, fontSize: 13, fontWeight: 800 }}>
                    {cantidad} {cantidad === 1 ? 'jugador' : 'jugadores'}
                  </span>
                </div>
                <div style={{
                  height: 8, borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${porcentaje}%`,
                    background: `linear-gradient(90deg, ${C.naranja}, #ED1E28)`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
