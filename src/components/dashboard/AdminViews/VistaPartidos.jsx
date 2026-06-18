import { useState, useEffect } from 'react';
import { C } from '../constants';

export default function VistaPartidos({ client }) {
  const [partidos, setPartidos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ goles_local: 0, goles_visitante: 0 });
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await client.get('/partidos');
      const finalizados = (res.data || []).filter(p => p.estado === 'finalizado');
      setPartidos(finalizados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch (err) {
      console.error(err);
    }
  };

  const abrirEditor = (p) => {
    setEditando(p);
    setForm({ goles_local: p.goles_local ?? 0, goles_visitante: p.goles_visitante ?? 0 });
    setMsg(null);
  };

  const reEvaluar = async () => {
    if (!editando) return;
    setCargando(true);
    setMsg(null);
    try {
      const res = await client.post(`/partidos/${editando.id}/re-evaluar`, {
        goles_local: Number(form.goles_local),
        goles_visitante: Number(form.goles_visitante),
      });
      setMsg({ tipo: 'ok', texto: `✅ ${res.data.mensaje} — ${res.data.acertadas_simple} simples, ${res.data.acertadas_especial} especiales, ${res.data.fallidas} fallidas` });
      cargar();
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.response?.data?.message || 'Error al re-evaluar' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ background: 'var(--card)', borderRadius: 14, padding: 20, border: `1px solid ${C.naranja}30` }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--texto)' }}>
        ⚽ Partidos Finalizados
      </h2>

      {/* Modal editor */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={() => setEditando(null)}>
          <div style={{ background: '#1a1230', borderRadius: 14, padding: 28, maxWidth: 420, width: '100%', border: `1px solid ${C.naranja}40` }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--texto)', fontWeight: 700, marginBottom: 4 }}>
              Corregir resultado
            </h3>
            <p style={{ color: 'var(--texto-sec)', fontSize: 13, marginBottom: 20 }}>
              {editando.local_equipo} vs {editando.visitante_equipo}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>{editando.local_equipo}</label>
                <input
                  type="number" min="0" max="30"
                  value={form.goles_local}
                  onChange={e => setForm(f => ({ ...f, goles_local: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.naranja}50`, background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 24, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
              <span style={{ color: 'var(--texto-sec)', fontWeight: 700, fontSize: 20 }}>-</span>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>{editando.visitante_equipo}</label>
                <input
                  type="number" min="0" max="30"
                  value={form.goles_visitante}
                  onChange={e => setForm(f => ({ ...f, goles_visitante: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.naranja}50`, background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 24, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
            </div>

            {msg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: msg.tipo === 'ok' ? 'rgba(22,199,132,0.1)' : 'rgba(231,76,60,0.1)', color: msg.tipo === 'ok' ? C.verde : '#e74c3c', fontSize: 13 }}>
                {msg.texto}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditando(null)}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--texto-sec)', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={reEvaluar} disabled={cargando}
                style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: C.naranja, color: 'white', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Procesando...' : '⚡ Corregir y re-evaluar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.naranja}40` }}>
              <th style={{ padding: '10px 8px', textAlign: 'left', color: C.naranja, fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', color: C.naranja, fontWeight: 600 }}>Partido</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Resultado</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {partidos.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px 8px', color: 'var(--texto-sec)', whiteSpace: 'nowrap' }}>{p.fecha}</td>
                <td style={{ padding: '10px 8px', color: 'var(--texto)', fontWeight: 500 }}>
                  {p.local_equipo} vs {p.visitante_equipo}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', color: C.dorado, fontWeight: 700 }}>
                  {p.goles_local} - {p.goles_visitante}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <button onClick={() => abrirEditor(p)}
                    style={{ background: `${C.naranja}20`, color: C.naranja, border: `1px solid ${C.naranja}50`, borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    ✏️ Corregir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
