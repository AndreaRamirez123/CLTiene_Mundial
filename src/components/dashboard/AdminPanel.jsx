import { useState, useEffect } from 'react';
import { C } from './constants';
import VistaUsuarios from './AdminViews/VistaUsuarios';
import VistaPrediciones from './AdminViews/VistaPrediciones';
import VistaEstadisticas from './AdminViews/VistaEstadisticas';

export default function AdminPanel({ usuario, client }) {
  const [tab, setTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [predicciones, setPrediciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!usuario?.uid) return;
    cargarDatos();
  }, [tab, usuario?.uid]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const headers = { 'x-user-uid': usuario.uid };
      
      if (tab === 'usuarios') {
        const res = await client.get('/admin/jugadores', { headers });
        setUsuarios(res.data.jugadores || []);
      }
      if (tab === 'predicciones') {
        const res = await client.get('/admin/predicciones/sin-validar', { headers });
        setPrediciones(res.data || []);
      }
      if (tab === 'estadisticas') {
        const res = await client.get('/admin/estadisticas', { headers });
        setEstadisticas(res.data);
      }
    } catch (err) {
      console.error('Error cargando datos admin:', err);
    } finally {
      setCargando(false);
    }
  };

  const btnTabStyle = (activo) => ({
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.3s',
    background: activo ? C.naranja : 'rgba(255,255,255,0.08)',
    color: activo ? 'white' : 'var(--texto-sec)',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px', paddingBottom: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--texto)', marginBottom: 8 }}>
            🛡️ Panel de Administrador
          </h1>
          <p style={{ color: 'var(--texto-sec)', fontSize: 14 }}>
            Controla todo en CLTiene Mundial
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('usuarios')}
            style={btnTabStyle(tab === 'usuarios')}
          >
            👥 Usuarios ({usuarios.length})
          </button>
          <button
            onClick={() => setTab('predicciones')}
            style={btnTabStyle(tab === 'predicciones')}
          >
            🎯 Predicciones ({predicciones.length})
          </button>
          <button
            onClick={() => setTab('estadisticas')}
            style={btnTabStyle(tab === 'estadisticas')}
          >
            📊 Estadísticas
          </button>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: C.naranja, fontSize: 16 }}>Cargando...</div>
          </div>
        ) : (
          <>
            {tab === 'usuarios' && <VistaUsuarios usuarios={usuarios} client={client} usuario={usuario} />}
            {tab === 'predicciones' && <VistaPrediciones predicciones={predicciones} />}
            {tab === 'estadisticas' && <VistaEstadisticas estadisticas={estadisticas} />}
          </>
        )}
      </div>
    </div>
  );
}
