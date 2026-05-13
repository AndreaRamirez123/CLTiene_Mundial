import { useState, useEffect } from 'react';
import { C } from '../constants';

export default function VistaEmpresas({ client }) {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormEmpresa, setMostrarFormEmpresa] = useState(false);
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(null); // empresaId
  const [formEmpresa, setFormEmpresa] = useState({ nombre: '', slug: '' });
  const [formAdmin, setFormAdmin] = useState({ email: '', password: '', nombre: '' });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    setCargando(true);
    try {
      const res = await client.get('/admin/empresas');
      setEmpresas(res.data || []);
    } catch (err) {
      console.error('Error cargando empresas:', err);
    } finally {
      setCargando(false);
    }
  };

  const crearEmpresa = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      await client.post('/admin/empresas', formEmpresa);
      setMensaje('Empresa creada correctamente');
      setFormEmpresa({ nombre: '', slug: '' });
      setMostrarFormEmpresa(false);
      cargarEmpresas();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creando empresa');
    }
  };

  const eliminarEmpresa = async (empresa) => {
    const confirmar = window.confirm(`¿Eliminar "${empresa.nombre}"? Se borrarán todos sus jugadores y datos. Esta acción NO se puede deshacer.`);
    if (!confirmar) return;
    const confirmar2 = window.confirm(`Segunda confirmación: ¿Estás seguro de eliminar "${empresa.nombre}" permanentemente?`);
    if (!confirmar2) return;
    try {
      await client.delete(`/admin/empresas/${empresa.id}`);
      setMensaje(`Empresa "${empresa.nombre}" eliminada.`);
      cargarEmpresas();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la empresa');
    }
  };

  const crearAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      const res = await client.post(`/admin/empresas/${mostrarFormAdmin}/crear-admin`, formAdmin);
      const msg = res.data?.promovido ? 'Usuario existente promovido a admin' : 'Admin creado correctamente';
      setMensaje(msg);
      alert(msg);
      setFormAdmin({ email: '', password: '', nombre: '' });
      setMostrarFormAdmin(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creando admin');
    }
  };

  const generarSlug = (nombre) => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--texto)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const btnStyle = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    background: C.naranja,
    color: 'white',
  };

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: 40, color: C.naranja }}>Cargando empresas...</div>;
  }

  return (
    <div>
      {mensaje && (
        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(46,204,113,0.15)', color: '#2ecc71', marginBottom: 16, fontSize: 14 }}>
          {mensaje}
        </div>
      )}
      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(231,76,60,0.15)', color: '#e74c3c', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Boton crear empresa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: 'var(--texto)', fontSize: 20, fontWeight: 700 }}>
          Empresas ({empresas.length})
        </h2>
        <button style={btnStyle} onClick={() => setMostrarFormEmpresa(!mostrarFormEmpresa)}>
          + Nueva empresa
        </button>
      </div>

      {/* Form crear empresa */}
      {mostrarFormEmpresa && (
        <form onSubmit={crearEmpresa} style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h3 style={{ color: 'var(--texto)', marginBottom: 16, fontSize: 16 }}>Crear empresa</h3>
          <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
            <div>
              <label style={{ color: 'var(--texto-sec)', fontSize: 12, marginBottom: 4, display: 'block' }}>Nombre</label>
              <input
                style={inputStyle}
                placeholder="Nombre de la empresa"
                value={formEmpresa.nombre}
                onChange={(e) => setFormEmpresa({
                  nombre: e.target.value,
                  slug: generarSlug(e.target.value),
                })}
                required
              />
            </div>
            <div>
              <label style={{ color: 'var(--texto-sec)', fontSize: 12, marginBottom: 4, display: 'block' }}>Slug (URL)</label>
              <input
                style={inputStyle}
                placeholder="slug-empresa"
                value={formEmpresa.slug}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, slug: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={btnStyle}>Crear</button>
              <button type="button" style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)' }} onClick={() => setMostrarFormEmpresa(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Form crear admin */}
      {mostrarFormAdmin && (
        <form onSubmit={crearAdmin} style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h3 style={{ color: 'var(--texto)', marginBottom: 16, fontSize: 16 }}>
            Crear Admin para Empresa #{mostrarFormAdmin}
          </h3>
          <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
            <div>
              <label style={{ color: 'var(--texto-sec)', fontSize: 12, marginBottom: 4, display: 'block' }}>Nombre</label>
              <input
                style={inputStyle}
                placeholder="Nombre del admin"
                value={formAdmin.nombre}
                onChange={(e) => setFormAdmin({ ...formAdmin, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ color: 'var(--texto-sec)', fontSize: 12, marginBottom: 4, display: 'block' }}>Email</label>
              <input
                style={inputStyle}
                type="email"
                placeholder="admin@empresa.com"
                value={formAdmin.email}
                onChange={(e) => setFormAdmin({ ...formAdmin, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ color: 'var(--texto-sec)', fontSize: 12, marginBottom: 4, display: 'block' }}>Contraseña</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formAdmin.password}
                onChange={(e) => setFormAdmin({ ...formAdmin, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={btnStyle}>Crear admin</button>
              <button type="button" style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)' }} onClick={() => setMostrarFormAdmin(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de empresas */}
      <div style={{ display: 'grid', gap: 12 }}>
        {empresas.map((empresa) => (
          <div
            key={empresa.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ color: 'var(--texto)', fontWeight: 700, fontSize: 16 }}>
                {empresa.nombre}
              </div>
              <div style={{ color: 'var(--texto-sec)', fontSize: 13, marginTop: 4 }}>
                Slug: <code>{empresa.slug}</code> | Estado:{' '}
                <span style={{ color: empresa.estado === 'activa' ? '#2ecc71' : '#e74c3c' }}>
                  {empresa.estado}
                </span>
              </div>
              <div style={{ color: 'var(--texto-sec)', fontSize: 12, marginTop: 2 }}>
                Creada: {new Date(empresa.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ ...btnStyle, fontSize: 12, padding: '8px 14px' }}
                onClick={() => {
                  setMostrarFormAdmin(empresa.id);
                  setFormAdmin({ email: '', password: '', nombre: '' });
                  setError('');
                  setMensaje('');
                }}
              >
                + Admin
              </button>
              <button
                style={{ ...btnStyle, fontSize: 12, padding: '8px 14px', background: 'rgba(231,76,60,0.2)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.3)' }}
                onClick={() => eliminarEmpresa(empresa)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {empresas.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--texto-sec)' }}>
            No hay empresas creadas aún. Crea la primera.
          </div>
        )}
      </div>
    </div>
  );
}
