import { useState, useEffect } from 'react';
import { C } from './constants';
import { getNombreMarca } from '../../utils/marca';
import VistaUsuarios from './AdminViews/VistaUsuarios';
import VistaPrediciones from './AdminViews/VistaPrediciones';
import VistaEstadisticas from './AdminViews/VistaEstadisticas';
import VistaGeo from './AdminViews/VistaGeo';
import VistaMarca from './AdminViews/VistaMarca';
import VistaEmpresas from './AdminViews/VistaEmpresas';
import VistaPartidos from './AdminViews/VistaPartidos';

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
        <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--texto)', marginBottom: 8 }}>
              🛡️ Panel de administrador
            </h1>
            <p style={{ color: 'var(--texto-sec)', fontSize: 14 }}>
              Controla todo en {getNombreMarca()}
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const [rankRes, adminRes] = await Promise.all([
                  client.get('/ranking?limit=10000'),
                  client.get('/admin/jugadores?limit=1000'),
                ]);
                const ranking = rankRes.data || [];
                const adminUsers = adminRes.data?.jugadores || [];

                // UIDs ya en el ranking
                const rankUids = new Set(ranking.map(r => r.uid));

                // Mapa uid→datos admin para enriquecer
                const adminMap = {};
                adminUsers.forEach(u => { if (u.uid) adminMap[u.uid] = u; });

                // Filas del ranking (con email desde admin)
                const rankedRows = ranking.map(j => {
                  const a = adminMap[j.uid] || {};
                  const email = a.email || a.correo || '';
                  const nombre = (j.nombre && j.nombre !== 'Jugador anónimo') ? j.nombre : (email || 'Sin nombre');
                  return { pos: j.posicion, nombre, email, goles: j.goles, acertadas: j.predicciones_acertadas, monedas: j.monedas };
                });

                // Usuarios que están en admin pero NO en ranking (registrados pero sin actividad)
                const missingRows = adminUsers
                  .filter(u => !rankUids.has(u.uid))
                  .map((u, i) => {
                    const email = u.email || u.correo || '';
                    const nombre = u.nombre || email || 'Sin nombre';
                    return { pos: ranking.length + i + 1, nombre, email, goles: u.goles || 0, acertadas: u.predicciones_acertadas || 0, monedas: u.monedas || 0 };
                  });

                const allRows = [...rankedRows, ...missingRows];
                const medals = ['🥇', '🥈', '🥉'];
                const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

                const tableRows = allRows.map(j => {
                  const top = j.pos <= 3;
                  const medal = j.pos <= 3 ? medals[j.pos - 1] + ' ' : '';
                  const bg = j.pos === 1 ? '#fffbea' : j.pos === 2 ? '#f8f8f8' : j.pos === 3 ? '#fff5f0' : (j.pos % 2 === 0 ? '#fafafa' : '#ffffff');
                  const fw = top ? '700' : '400';
                  return `<tr style="background:${bg};font-weight:${fw}">
                    <td style="text-align:center;color:${top?'#c07700':'#666'};font-weight:700">${medal}${j.pos}</td>
                    <td>${j.nombre}</td>
                    <td style="color:#555;font-size:12px">${j.email}</td>
                    <td style="text-align:center;color:#1a7f3c;font-weight:${top?'800':'600'}">${j.goles}</td>
                    <td style="text-align:center;color:#555">${j.acertadas}</td>
                    <td style="text-align:center;color:#c05700;font-weight:${top?'800':'600'}">${j.monedas}</td>
                  </tr>`;
                }).join('');

                const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
                <title>Resultados - Mundial 2026 - ${getNombreMarca()}</title>
                <style>
                  * { margin:0; padding:0; box-sizing:border-box; }
                  body { font-family: Arial, sans-serif; background:#f5f5f5; padding: 30px; color:#222; }
                  .header { background:linear-gradient(135deg,#ED1E28,#FD7751); color:white; border-radius:12px; padding:24px 32px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; }
                  .header h1 { font-size:22px; font-weight:900; letter-spacing:1px; }
                  .header .sub { font-size:13px; opacity:0.85; margin-top:4px; }
                  .header .fecha { font-size:12px; opacity:0.75; text-align:right; }
                  table { width:100%; border-collapse:collapse; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
                  thead tr { background:linear-gradient(135deg,#1a1a2e,#16213e); color:white; }
                  thead th { padding:12px 16px; font-size:13px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }
                  tbody td { padding:10px 16px; font-size:13px; border-bottom:1px solid #f0f0f0; }
                  tbody tr:last-child td { border-bottom:none; }
                  tbody tr:hover { filter:brightness(0.97); }
                  .footer { text-align:center; margin-top:20px; font-size:11px; color:#999; }
                  @media print { body{padding:10px;background:white} .no-print{display:none} }
                </style></head><body>
                <div class="header">
                  <div><h1>🏆 Resultados Finales · Copa Mundial 2026</h1><div class="sub">${getNombreMarca()} · ${allRows.length} participantes</div></div>
                  <div class="fecha">${fecha}<br><button class="no-print" onclick="window.print()" style="margin-top:8px;padding:8px 18px;background:white;color:#ED1E28;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px">🖨️ Imprimir / PDF</button></div>
                </div>
                <table>
                  <thead><tr>
                    <th style="width:60px">Pos.</th><th style="text-align:left">Nombre</th><th style="text-align:left">Email</th>
                    <th>⚽ Goles</th><th>✅ Aciertos</th><th>🪙 Monedas</th>
                  </tr></thead>
                  <tbody>${tableRows}</tbody>
                </table>
                <div class="footer">Generado el ${fecha} · ${getNombreMarca()} · Copa Mundial 2026</div>
                </body></html>`;

                const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              } catch (e) {
                alert('Error al exportar');
              }
            }}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #16C784, #0da86e)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            📥 Exportar participantes CSV
          </button>
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
            onClick={() => setTab('partidos')}
            style={btnTabStyle(tab === 'partidos')}
          >
            ⚽ Partidos
          </button>
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
            {tab === 'partidos' && <VistaPartidos client={client} />}
            {tab === 'marca' && <VistaMarca client={client} usuario={usuario} />}
          </>
        )}
      </div>
    </div>
  );
}
