import { C } from '../constants';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function VistaEstadisticas({ estadisticas }) {
  if (!estadisticas) {
    return <div style={{ color: 'var(--texto-sec)', textAlign: 'center', padding: 40 }}>Cargando estadisticas...</div>;
  }

  const cards = [
    { label: 'Total Jugadores', valor: estadisticas.total_jugadores, icono: '👥', color: C.azul, bg: 'rgba(64,141,255,0.1)' },
    { label: 'Total Predicciones', valor: estadisticas.total_predicciones, icono: '🎯', color: C.naranja, bg: 'rgba(253,119,81,0.1)' },
    { label: 'Monedas en Circulacion', valor: (estadisticas.total_monedas_en_circulacion || 0).toLocaleString(), icono: '🪙', color: C.dorado, bg: 'rgba(236,168,45,0.1)' },
    { label: 'Administradores', valor: estadisticas.admins, icono: '🛡️', color: C.verde, bg: 'rgba(22,199,132,0.1)' },
  ];

  const actividad = estadisticas.actividad || {};
  const engagement = estadisticas.engagement || {};
  const porEmpresa = estadisticas.por_empresa || [];
  const porRol = estadisticas.por_rol || [];
  const totalJ = engagement.total || estadisticas.total_jugadores || 1;
  const pctPredicciones = Math.round((engagement.con_predicciones || 0) / totalJ * 100);
  const pctTrivia = Math.round((engagement.con_trivia || 0) / totalJ * 100);
  const pctReferidos = Math.round((engagement.con_referidos || 0) / totalJ * 100);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#999', font: { size: 12 } } },
    },
  };

  // Barras: actividad real de usuarios
  const dataActividad = {
    labels: ['Hoy', 'Esta semana', 'Este mes', 'Inactivos (+30d)'],
    datasets: [{
      label: 'Usuarios',
      data: [actividad.hoy || 0, actividad.semana || 0, actividad.mes || 0, actividad.inactivos || 0],
      backgroundColor: ['#16C784', '#408DFF', '#ECA82D', '#ED1E28'],
      borderRadius: 8,
    }],
  };

  const actividadBarOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: '#999', font: { size: 11 } }, grid: { display: false } },
      y: { ticks: { color: '#666', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  // Dona: jugadores por rol
  const dataRol = {
    labels: porRol.map((r) => r.rol === 'superadmin' ? 'Superadmin' : r.rol === 'admin' ? 'Admin' : 'Jugador'),
    datasets: [{
      data: porRol.map((r) => parseInt(r.cantidad)),
      backgroundColor: ['#822BD2', '#408DFF', '#ECA82D'],
      borderWidth: 0,
    }],
  };

  // Barras: jugadores por empresa (superadmin)
  const dataEmpresa = {
    labels: porEmpresa.map((e) => e.empresa),
    datasets: [
      {
        label: 'Jugadores',
        data: porEmpresa.map((e) => parseInt(e.jugadores)),
        backgroundColor: '#408DFF',
        borderRadius: 6,
      },
      {
        label: 'Monedas',
        data: porEmpresa.map((e) => parseInt(e.monedas) || 0),
        backgroundColor: '#ECA82D',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    ...chartOptions,
    indexAxis: 'y',
    plugins: {
      ...chartOptions.plugins,
      legend: { labels: { color: '#999', font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: '#666' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#ccc', font: { size: 11 } }, grid: { display: false } },
    },
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: card.bg, border: `2px solid ${card.color}40`,
            borderRadius: 14, padding: 20, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{card.icono}</div>
            <div style={{ color: 'var(--texto-sec)', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{card.label}</div>
            <div style={{ color: card.color, fontSize: 28, fontWeight: 900 }}>{card.valor}</div>
          </div>
        ))}
      </div>

      {/* Engagement */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(130,43,210,0.08), rgba(64,141,255,0.08))',
        borderRadius: 14, padding: 20, marginBottom: 24,
        border: '1px solid rgba(130,43,210,0.2)',
      }}>
        <h3 style={{ color: 'var(--texto)', fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
          🔥 Engagement
        </h3>
        <p style={{ color: 'var(--texto-sec)', fontSize: 12, marginBottom: 18 }}>
          Porcentaje de usuarios que participaron en cada actividad
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Hicieron predicciones', valor: engagement.con_predicciones || 0, pct: pctPredicciones, color: '#FD7751' },
            { label: 'Jugaron trivia', valor: engagement.con_trivia || 0, pct: pctTrivia, color: '#408DFF' },
            { label: 'Invitaron amigos', valor: engagement.con_referidos || 0, pct: pctReferidos, color: '#16C784' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16,
              border: `1px solid ${item.color}30`, textAlign: 'center',
            }}>
              <div style={{ color: item.color, fontSize: 32, fontWeight: 900 }}>{item.pct}%</div>
              <div style={{
                height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10,
                margin: '10px 0', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${item.pct}%`,
                  background: item.color, borderRadius: 10,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ color: 'var(--texto-sec)', fontSize: 11, fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: 'var(--texto-ter)', fontSize: 10, marginTop: 4 }}>
                {item.valor} de {totalJ} usuarios
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graficas */}
      <div style={{ display: 'grid', gridTemplateColumns: porEmpresa.length > 0 ? '1fr 1fr' : '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Barras: Actividad de usuarios */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <h3 style={{ color: 'var(--texto)', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Actividad de Usuarios
          </h3>
          <div style={{ height: 220 }}>
            <Bar data={dataActividad} options={actividadBarOptions} />
          </div>
        </div>

        {/* Dona: Roles */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <h3 style={{ color: 'var(--texto)', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Distribucion por Rol
          </h3>
          <div style={{ height: 220 }}>
            {porRol.length > 0 ? (
              <Doughnut data={dataRol} options={chartOptions} />
            ) : (
              <div style={{ color: 'var(--texto-sec)', textAlign: 'center', paddingTop: 80 }}>Sin datos</div>
            )}
          </div>
        </div>
      </div>

      {/* Barras: Por empresa (solo superadmin) */}
      {porEmpresa.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20,
          border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24,
        }}>
          <h3 style={{ color: 'var(--texto)', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Jugadores y Monedas por Empresa
          </h3>
          <div style={{ height: Math.max(200, porEmpresa.length * 60) }}>
            <Bar data={dataEmpresa} options={barOptions} />
          </div>
        </div>
      )}

      {/* Resumen */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <h3 style={{ color: 'var(--texto)', marginBottom: 16, fontSize: 14, fontWeight: 700 }}>
          Resumen
        </h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
            <span style={{ color: 'var(--texto-sec)', fontSize: 13 }}>Predicciones por Jugador</span>
            <span style={{ color: C.naranja, fontWeight: 700 }}>
              {estadisticas.total_jugadores > 0 ? (estadisticas.total_predicciones / estadisticas.total_jugadores).toFixed(1) : '0'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
            <span style={{ color: 'var(--texto-sec)', fontSize: 13 }}>Monedas Promedio por Jugador</span>
            <span style={{ color: C.dorado, fontWeight: 700 }}>
              {estadisticas.total_jugadores > 0 ? Math.round(estadisticas.total_monedas_en_circulacion / estadisticas.total_jugadores) : '0'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--texto-sec)', fontSize: 13 }}>Ultima Actualizacion</span>
            <span style={{ color: C.verde, fontWeight: 700, fontSize: 13 }}>
              {new Date(estadisticas.fecha).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
