import { useState, useEffect } from 'react';
import { C } from '../constants';

const FASES = ['Grupos', 'Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinales', 'Tercer puesto', 'Final'];

const FORM_VACIO = {
  local_equipo: '', bandera_local: '',
  visitante_equipo: '', bandera_visitante: '',
  fecha: '', hora: '', fase: 'Dieciseisavos', grupo: '',
};

export default function VistaPartidos({ client }) {
  const [partidos, setPartidos] = useState([]);
  const [faseActiva, setFaseActiva] = useState('Dieciseisavos');
  const [editando, setEditando] = useState(null);
  const [buscandoIA, setBuscandoIA] = useState(null); // id del partido buscando
  const [formResult, setFormResult] = useState({ goles_local: 0, goles_visitante: 0 });
  const [creando, setCreando] = useState(false);
  const [formNuevo, setFormNuevo] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await client.get('/partidos');
      setPartidos(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 4000);
  };

  const partidosFase = partidos
    .filter(p => p.fase === faseActiva)
    .sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora));

  const abrirEditor = (p) => {
    setEditando(p);
    setFormResult({ goles_local: p.goles_local ?? 0, goles_visitante: p.goles_visitante ?? 0 });
    setMsg(null);
  };

  const guardarResultado = async () => {
    if (!editando) return;
    setCargando(true);
    setMsg(null);
    try {
      const res = await client.put(`/partidos/${editando.id}/resultado`, {
        goles_local: Number(formResult.goles_local),
        goles_visitante: Number(formResult.goles_visitante),
      });
      mostrarMsg('ok', `✅ ${res.data.mensaje}`);
      setEditando(null);
      cargar();
    } catch (err) {
      mostrarMsg('error', err.response?.data?.message || 'Error al actualizar');
    } finally {
      setCargando(false);
    }
  };

  const reEvaluar = async () => {
    if (!editando) return;
    setCargando(true);
    setMsg(null);
    try {
      const res = await client.post(`/partidos/${editando.id}/re-evaluar`, {
        goles_local: Number(formResult.goles_local),
        goles_visitante: Number(formResult.goles_visitante),
      });
      mostrarMsg('ok', `✅ ${res.data.mensaje} — ${res.data.acertadas_simple} simples, ${res.data.acertadas_especial} especiales, ${res.data.fallidas} fallidas`);
      setEditando(null);
      cargar();
    } catch (err) {
      mostrarMsg('error', err.response?.data?.message || 'Error al re-evaluar');
    } finally {
      setCargando(false);
    }
  };

  const eliminarPartido = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el partido "${nombre}"? También se borrarán sus predicciones.`)) return;
    try {
      await client.delete(`/partidos/${id}`);
      mostrarMsg('ok', '✅ Partido eliminado');
      cargar();
    } catch (err) {
      mostrarMsg('error', err.response?.data?.message || 'Error al eliminar');
    }
  };

  const buscarResultadoIA = async (partido) => {
    setBuscandoIA(partido.id);
    try {
      const res = await client.post('/partidos/actualizar-resultados');
      const encontrado = (res.data?.resultados || []).find(r =>
        r.includes(partido.local_equipo) || r.includes(partido.visitante_equipo)
      );
      if (encontrado) {
        mostrarMsg('ok', `✅ ${encontrado}`);
        cargar();
      } else {
        mostrarMsg('error', `Sin resultado aún para ${partido.local_equipo} vs ${partido.visitante_equipo} — el partido puede no haber terminado`);
      }
    } catch (err) {
      mostrarMsg('error', err.response?.data?.message || 'Error al buscar resultado');
    } finally {
      setBuscandoIA(null);
    }
  };

  const actualizarTodos = async () => {
    setBuscandoIA('all');
    try {
      const res = await client.post('/partidos/actualizar-resultados');
      mostrarMsg('ok', `✅ ${res.data?.mensaje || 'Proceso completado'} — ${(res.data?.resultados || []).join(' | ')}`);
      cargar();
    } catch (err) {
      mostrarMsg('error', err.response?.data?.message || 'Error al actualizar');
    } finally {
      setBuscandoIA(null);
    }
  };

  const crearPartido = async () => {
    if (!formNuevo.local_equipo || !formNuevo.visitante_equipo || !formNuevo.fecha || !formNuevo.hora) {
      mostrarMsg('error', 'Completa local, visitante, fecha y hora');
      return;
    }
    setCargando(true);
    try {
      await client.post('/partidos', {
        ...formNuevo,
        grupo: formNuevo.grupo || null,
        bandera_local: formNuevo.bandera_local || 'xx',
        bandera_visitante: formNuevo.bandera_visitante || 'xx',
      });
      mostrarMsg('ok', '✅ Partido creado');
      setCreando(false);
      setFormNuevo(FORM_VACIO);
      cargar();
    } catch (err) {
      mostrarMsg('error', err.response?.data?.message || 'Error al crear');
    } finally {
      setCargando(false);
    }
  };

  const estadoColor = (estado) => {
    if (estado === 'finalizado') return C.verde;
    if (estado === 'en_curso') return C.dorado;
    return 'var(--texto-ter)';
  };

  return (
    <div style={{ background: 'var(--card)', borderRadius: 14, padding: 20, border: `1px solid ${C.naranja}30` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--texto)', margin: 0 }}>⚽ Gestión de Partidos</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={actualizarTodos}
            disabled={buscandoIA === 'all'}
            style={{ background: 'rgba(22,199,132,0.15)', color: C.verde, border: `1px solid ${C.verde}50`, borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: buscandoIA === 'all' ? 'not-allowed' : 'pointer', opacity: buscandoIA === 'all' ? 0.7 : 1 }}
          >
            {buscandoIA === 'all' ? '🔄 Buscando...' : '🤖 Buscar resultados IA'}
          </button>
          <button
            onClick={() => { setCreando(true); setFormNuevo({ ...FORM_VACIO, fase: faseActiva }); }}
            style={{ background: C.naranja, color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            + Crear partido
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: msg.tipo === 'ok' ? 'rgba(22,199,132,0.1)' : 'rgba(231,76,60,0.1)', color: msg.tipo === 'ok' ? C.verde : '#e74c3c', fontSize: 13 }}>
          {msg.texto}
        </div>
      )}

      {/* Tabs de fase */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {FASES.map(f => (
          <button key={f} onClick={() => setFaseActiva(f)}
            style={{ padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 12, fontWeight: 700, border: 'none',
              background: faseActiva === f ? `${C.naranja}30` : 'rgba(255,255,255,0.06)',
              color: faseActiva === f ? C.naranja : 'var(--texto-sec)',
            }}
          >
            {f} ({partidos.filter(p => p.fase === f).length})
          </button>
        ))}
      </div>

      {/* Tabla de partidos */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.naranja}40` }}>
              <th style={{ padding: '8px 6px', textAlign: 'left', color: C.naranja, fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', color: C.naranja, fontWeight: 600 }}>Partido</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Resultado</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', color: C.naranja, fontWeight: 600 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {partidosFase.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--texto-ter)' }}>
                No hay partidos en esta fase
              </td></tr>
            ) : partidosFase.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '9px 6px', color: 'var(--texto-sec)', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {p.fecha}<br /><span style={{ color: 'var(--texto-ter)' }}>{p.hora}</span>
                </td>
                <td style={{ padding: '9px 6px', color: 'var(--texto)', fontWeight: 500 }}>
                  {p.local_equipo} vs {p.visitante_equipo}
                </td>
                <td style={{ padding: '9px 6px', textAlign: 'center', color: C.dorado, fontWeight: 700 }}>
                  {p.estado === 'finalizado' ? `${p.goles_local} - ${p.goles_visitante}` : '—'}
                </td>
                <td style={{ padding: '9px 6px', textAlign: 'center' }}>
                  <span style={{ color: estadoColor(p.estado), fontSize: 11, fontWeight: 700 }}>{p.estado}</span>
                </td>
                <td style={{ padding: '9px 6px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {p.estado === 'pendiente' && (
                      <button
                        onClick={() => buscarResultadoIA(p)}
                        disabled={!!buscandoIA}
                        title="Buscar resultado automáticamente con IA"
                        style={{ background: 'rgba(22,199,132,0.15)', color: C.verde, border: `1px solid ${C.verde}40`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: buscandoIA ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: buscandoIA === p.id ? 0.6 : 1 }}>
                        {buscandoIA === p.id ? '🔄' : '🤖'}
                      </button>
                    )}
                    <button onClick={() => abrirEditor(p)}
                      style={{ background: `${C.naranja}20`, color: C.naranja, border: `1px solid ${C.naranja}50`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      ✏️ Resultado
                    </button>
                    <button onClick={() => eliminarPartido(p.id, `${p.local_equipo} vs ${p.visitante_equipo}`)}
                      style={{ background: 'rgba(231,76,60,0.15)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: editar resultado */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={() => !cargando && setEditando(null)}>
          <div style={{ background: '#1a1230', borderRadius: 14, padding: 28, maxWidth: 420, width: '100%', border: `1px solid ${C.naranja}40` }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--texto)', fontWeight: 700, marginBottom: 4 }}>Ingresar resultado</h3>
            <p style={{ color: 'var(--texto-sec)', fontSize: 13, marginBottom: 20 }}>
              {editando.fase} · {editando.fecha} {editando.hora}<br />
              <strong>{editando.local_equipo}</strong> vs <strong>{editando.visitante_equipo}</strong>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>{editando.local_equipo}</label>
                <input type="number" min="0" max="30" value={formResult.goles_local}
                  onChange={e => setFormResult(f => ({ ...f, goles_local: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.naranja}50`, background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 24, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
              <span style={{ color: 'var(--texto-sec)', fontWeight: 700, fontSize: 20 }}>-</span>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>{editando.visitante_equipo}</label>
                <input type="number" min="0" max="30" value={formResult.goles_visitante}
                  onChange={e => setFormResult(f => ({ ...f, goles_visitante: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.naranja}50`, background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 24, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
            </div>
            <p style={{ color: 'var(--texto-ter)', fontSize: 11, marginBottom: 14 }}>
              💡 Para penales: pon el marcador al 90'+extra, el ganador en penales se define por quién tenga más goles en la simulación. Si fue 1-1 y el visitante ganó en penales, pon 1-0 a favor del visitante para que las predicciones se evalúen correctamente.
            </p>
            {msg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: msg.tipo === 'ok' ? 'rgba(22,199,132,0.1)' : 'rgba(231,76,60,0.1)', color: msg.tipo === 'ok' ? C.verde : '#e74c3c', fontSize: 13 }}>
                {msg.texto}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => !cargando && setEditando(null)}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--texto-sec)', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardarResultado} disabled={cargando}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: C.dorado, color: '#000', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
                {cargando ? '...' : '💾 Guardar'}
              </button>
              <button onClick={reEvaluar} disabled={cargando}
                style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: C.naranja, color: 'white', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Procesando...' : '⚡ Guardar + Re-evaluar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: crear partido */}
      {creando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={() => !cargando && setCreando(false)}>
          <div style={{ background: '#1a1230', borderRadius: 14, padding: 24, maxWidth: 480, width: '100%', border: `1px solid ${C.naranja}40`, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--texto)', fontWeight: 700, marginBottom: 16 }}>➕ Crear partido</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>Local *</label>
                <input value={formNuevo.local_equipo} onChange={e => setFormNuevo(f => ({ ...f, local_equipo: e.target.value }))}
                  placeholder="Ej: Francia"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>Bandera local (código ISO)</label>
                <input value={formNuevo.bandera_local} onChange={e => setFormNuevo(f => ({ ...f, bandera_local: e.target.value }))}
                  placeholder="Ej: fr"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>Visitante *</label>
                <input value={formNuevo.visitante_equipo} onChange={e => setFormNuevo(f => ({ ...f, visitante_equipo: e.target.value }))}
                  placeholder="Ej: Suecia"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>Bandera visitante (código ISO)</label>
                <input value={formNuevo.bandera_visitante} onChange={e => setFormNuevo(f => ({ ...f, bandera_visitante: e.target.value }))}
                  placeholder="Ej: se"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>Fecha *</label>
                <input type="date" value={formNuevo.fecha} onChange={e => setFormNuevo(f => ({ ...f, fecha: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>Hora (Colombia) *</label>
                <input type="time" value={formNuevo.hora} onChange={e => setFormNuevo(f => ({ ...f, hora: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 13 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>Fase *</label>
                <select value={formNuevo.fase} onChange={e => setFormNuevo(f => ({ ...f, fase: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1a1230', color: 'var(--texto)', fontSize: 13 }}>
                  {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--texto-sec)', display: 'block', marginBottom: 4 }}>Grupo (solo fase grupos)</label>
                <input value={formNuevo.grupo} onChange={e => setFormNuevo(f => ({ ...f, grupo: e.target.value.toUpperCase() }))}
                  placeholder="A, B, C... (vacío si es eliminatoria)"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'var(--texto)', fontSize: 13 }} />
              </div>
            </div>

            {msg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: msg.tipo === 'ok' ? 'rgba(22,199,132,0.1)' : 'rgba(231,76,60,0.1)', color: msg.tipo === 'ok' ? C.verde : '#e74c3c', fontSize: 13 }}>
                {msg.texto}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => !cargando && setCreando(false)}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--texto-sec)', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={crearPartido} disabled={cargando}
                style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: C.naranja, color: 'white', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Creando...' : '➕ Crear partido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
