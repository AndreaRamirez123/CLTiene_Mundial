import { useState, useEffect } from 'react';
import { C } from './constants';
import { getNombreMarca } from '../../utils/marca';
import VistaUsuarios from './AdminViews/VistaUsuarios';
import VistaPrediciones from './AdminViews/VistaPrediciones';
import VistaEstadisticas from './AdminViews/VistaEstadisticas';
import VistaGeo from './AdminViews/VistaGeo';
import VistaMarca from './AdminViews/VistaMarca';
import VistaEmpresas from './AdminViews/VistaEmpresas';

export default function AdminPanel({ usuario, client }) {
  const [tab, setTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [predicciones, setPrediciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const esSuperadmin = usuario?.rol === 'superadmin';

  useEffect(() => {
    if (!usuario?.uid) return;
    cargarDatos();
  }, [tab, usuario?.uid]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      if (tab === 'usuarios') {
        const res = await client.get('/admin/jugadores?limit=1000');
        setUsuarios(res.data.jugadores || []);
        setTotalUsuarios(res.data.total || 0);
      }
      if (tab === 'predicciones') {
        const res = await client.get('/admin/predicciones/sin-validar');
        setPrediciones(res.data || []);
      }
      if (tab === 'estadisticas') {
        const res = await client.get('/admin/estadisticas');
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
            🛡️ Panel de administrador
          </h1>
          <p style={{ color: 'var(--texto-sec)', fontSize: 14 }}>
            Controla todo en {getNombreMarca()}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('usuarios')}
            style={btnTabStyle(tab === 'usuarios')}
          >
            👥 Usuarios ({totalUsuarios})
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
          <button
            onClick={() => setTab('geo')}
            style={btnTabStyle(tab === 'geo')}
          >
            📍 Georreferenciación
          </button>
          {esSuperadmin && (
            <button
              onClick={() => setTab('empresas')}
              style={btnTabStyle(tab === 'empresas')}
            >
              🏢 Empresas
            </button>
          )}
          <button
            onClick={() => setTab('marca')}
            style={btnTabStyle(tab === 'marca')}
          >
            🎨 Marca
          </button>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: C.naranja, fontSize: 16 }}>Cargando...</div>
          </div>
        ) : (
          <>
            {tab === 'usuarios' && <VistaUsuarios usuarios={usuarios} client={client} />}
            {tab === 'predicciones' && <VistaPrediciones predicciones={predicciones} client={client} />}
            {tab === 'estadisticas' && <VistaEstadisticas estadisticas={estadisticas} />}
            {tab === 'geo' && <VistaGeo client={client} />}
            {tab === 'empresas' && esSuperadmin && <VistaEmpresas client={client} />}
            {tab === 'marca' && <VistaMarca client={client} usuario={usuario} />}
          </>
        )}
      </div>
    </div>
  );
}
