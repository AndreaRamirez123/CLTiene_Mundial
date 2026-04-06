import { useState, useEffect } from 'react'
import { aplicarConfigMarca } from './utils/marca'
import Login from './pages/login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import TutorialDemo from './components/dashboard/TutorialDemo'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [perfilCompleto, setPerfilCompleto] = useState(false)
  const [mostrarTutorial, setMostrarTutorial] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [preRegistro, setPreRegistro] = useState(null) // {email, password, empresa_slug}

  useEffect(() => {
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
    const user = { ...(usuario || {}), ...userActualizado }
    localStorage.setItem('usuario', JSON.stringify(user))
    setUsuario(user)
    setPerfilCompleto(true)
    setPreRegistro(null)
    // Mostrar tutorial despues del registro
    setMostrarTutorial(true)
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('config_marca')
    setUsuario(null)
    setPerfilCompleto(false)
    setMostrarTutorial(false)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--brand-primary)', fontSize: 18, fontWeight: 700 }}>Cargando...</div>
    </div>
  )

  if (!usuario && !preRegistro) return <Login onLoginExitoso={handleLogin} onPreRegistro={setPreRegistro} />
  if (preRegistro) return <Registro preRegistro={preRegistro} onRegistroCompleto={handleRegistroCompleto} onVolver={() => setPreRegistro(null)} />
  if (!perfilCompleto) return <Registro usuario={usuario} onRegistroCompleto={handleRegistroCompleto} onVolver={handleCerrarSesion} />

  return (
    <>
      <Dashboard usuario={usuario} onCerrarSesion={handleCerrarSesion} />
      {mostrarTutorial && (
        <TutorialDemo
          onTerminar={() => setMostrarTutorial(false)}
          onIrA={() => {}}
        />
      )}
    </>
  )
}
