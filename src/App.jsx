import { useState, useEffect } from 'react'
import { aplicarConfigMarca } from './utils/marca'
import Login from './pages/login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [perfilCompleto, setPerfilCompleto] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Aplicar config cacheada (la correcta se carga en login o dashboard)
    const cache = localStorage.getItem('config_marca')
    if (cache) {
      try { aplicarConfigMarca(JSON.parse(cache)) } catch { /* ignore */ }
    }

    const token = localStorage.getItem('token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (token && usuarioGuardado) {
      const user = JSON.parse(usuarioGuardado)
      setUsuario(user)
      setPerfilCompleto(!!user.nombre)
    }
    setCargando(false)
  }, [])

  const handleLogin = (user) => {
    setUsuario(user)
    setPerfilCompleto(!!user.nombre)
  }

  const handleRegistroCompleto = (userActualizado) => {
    const user = { ...usuario, ...userActualizado }
    localStorage.setItem('usuario', JSON.stringify(user))
    setUsuario(user)
    setPerfilCompleto(true)
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('config_marca')
    setUsuario(null)
    setPerfilCompleto(false)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--brand-primary)', fontSize: 18, fontWeight: 700 }}>Cargando...</div>
    </div>
  )

  if (!usuario) return <Login onLoginExitoso={handleLogin} />
  if (!perfilCompleto) return <Registro usuario={usuario} onRegistroCompleto={handleRegistroCompleto} onVolver={handleCerrarSesion} />
  return <Dashboard usuario={usuario} onCerrarSesion={handleCerrarSesion} />
}
