import { useState, useEffect } from 'react'
import client from './api/client'
import { aplicarConfigMarca, guardarConfigMarca } from './utils/marca'
import Login from './pages/login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'

// Extraer slug de empresa desde la URL: /divergency -> "divergency"
function getEmpresaSlug() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
  // Ignorar rutas conocidas del frontend
  if (!path || path === 'login' || path === 'registro') return 'default'
  return path
}

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [perfilCompleto, setPerfilCompleto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [empresaSlug] = useState(getEmpresaSlug)
  const [, setMarcaVersion] = useState(0)

  useEffect(() => {
    const cache = localStorage.getItem('config_marca')
    if (cache) {
      try {
        aplicarConfigMarca(JSON.parse(cache))
        setMarcaVersion((v) => v + 1)
      } catch {
        // cache corrupto
      }
    }

    // Cargar config de marca de la empresa actual
    client.get(`/auth/config-publica/${empresaSlug}`)
      .then((res) => {
        if (res?.data) {
          guardarConfigMarca(res.data)
          setMarcaVersion((v) => v + 1)
        }
      })
      .catch(() => {})

    // Verificar sesion guardada
    const token = localStorage.getItem('token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (token && usuarioGuardado) {
      const user = JSON.parse(usuarioGuardado)
      setUsuario(user)
      setPerfilCompleto(!!user.nombre)
    }
    setCargando(false)
  }, [empresaSlug])

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--brand-primary)', fontSize: 18, fontWeight: 700 }}>Cargando...</div>
    </div>
  )

  if (!usuario) return <Login onLoginExitoso={handleLogin} empresaSlug={empresaSlug} />
  if (!perfilCompleto) return <Registro usuario={usuario} onRegistroCompleto={handleRegistroCompleto} onVolver={handleCerrarSesion} />
  return <Dashboard usuario={usuario} onCerrarSesion={handleCerrarSesion} />
}
