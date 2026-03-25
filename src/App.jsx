import { useState, useEffect } from 'react'
import client from './api/client'
import Login from './pages/login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [perfilCompleto, setPerfilCompleto] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Verificar si hay sesión guardada
    const token = localStorage.getItem('token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (token && usuarioGuardado) {
      const user = JSON.parse(usuarioGuardado)
      setUsuario(user)
      // Verificar que el perfil esté completo (tiene nombre)
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
    setUsuario(null)
    setPerfilCompleto(false)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#FD7751', fontSize: 18, fontWeight: 700 }}>Cargando...</div>
    </div>
  )

  if (!usuario) return <Login onLoginExitoso={handleLogin} />
  if (!perfilCompleto) return <Registro usuario={usuario} onRegistroCompleto={handleRegistroCompleto} onVolver={handleCerrarSesion} />
  return <Dashboard usuario={usuario} onCerrarSesion={handleCerrarSesion} />
}
