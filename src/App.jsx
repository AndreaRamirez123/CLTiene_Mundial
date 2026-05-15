import { useState, useEffect, useRef } from 'react'
import { aplicarConfigMarca, guardarConfigMarca } from './utils/marca'
import client from './api/client'
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
  const ssoEjecutado = useRef(false)

  useEffect(() => {
    const cache = localStorage.getItem('config_marca')
    if (cache) {
      try { aplicarConfigMarca(JSON.parse(cache)) } catch { /* ignore */ }
    }

    // SSO CUN 360: detectar parametros en la URL
    const params = new URLSearchParams(window.location.search)
    const ssoUser = params.get('user')
    const ssoSession = params.get('session')

    // Opcion C (preferida): token de sesion temporal server-to-server
    if (ssoSession) {
      // Siempre hacer return si hay session en URL, incluso si ya se disparo
      // (evita que StrictMode cargue al usuario previo del localStorage)
      if (!ssoEjecutado.current) {
        ssoEjecutado.current = true
        // Limpiar sesion previa antes de iniciar SSO
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        localStorage.removeItem('config_marca')
        client.post('/auth/sso-session', { session_token: ssoSession })
          .then(({ data }) => {
            localStorage.setItem('token', data.token)
            localStorage.setItem('usuario', JSON.stringify(data.usuario))
            localStorage.setItem('cun360_origen', 'true')
            const returnUrl = params.get('return') || document.referrer || 'https://cun360.cun.edu.co'
            localStorage.setItem('cun360_return_url', returnUrl)
            setUsuario(data.usuario)
            setPerfilCompleto(true)
            window.history.replaceState({}, document.title, window.location.pathname)
            return client.get('/auth/config-publica/cun')
          })
          .then((res) => {
            if (res?.data) guardarConfigMarca(res.data)
          })
          .catch((err) => {
            console.error('Error SSO session:', err)
          })
          .finally(() => setCargando(false))
      }
      return
    }

    // Opcion simple (legado): ?user=correo@cun.edu.co
    if (ssoUser && ssoUser.endsWith('@cun.edu.co')) {
      if (!ssoEjecutado.current) {
        ssoEjecutado.current = true
        // Limpiar sesion previa antes de iniciar SSO
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        localStorage.removeItem('config_marca')
        client.post('/auth/sso-cun', { email: ssoUser, empresa_slug: 'cun' })
          .then(({ data }) => {
            localStorage.setItem('token', data.token)
            localStorage.setItem('usuario', JSON.stringify(data.usuario))
            localStorage.setItem('cun360_origen', 'true')
            const returnUrl = params.get('return') || document.referrer || 'https://cun360.cun.edu.co'
            localStorage.setItem('cun360_return_url', returnUrl)
            setUsuario(data.usuario)
            setPerfilCompleto(true)
            window.history.replaceState({}, document.title, window.location.pathname)
            return client.get('/auth/config-publica/cun')
          })
          .then((res) => {
            if (res?.data) guardarConfigMarca(res.data)
          })
          .catch((err) => {
            console.error('Error SSO CUN 360:', err)
          })
          .finally(() => setCargando(false))
      }
      return
    }

    const token = localStorage.getItem('token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (token && usuarioGuardado) {
      const user = JSON.parse(usuarioGuardado)
      setUsuario(user)
      setPerfilCompleto(!!user.nombre)
      // Refrescar config de marca en segundo plano para asegurar que sea la correcta
      client.get('/config-marca')
        .then((res) => { if (res?.data) guardarConfigMarca(res.data) })
        .catch(() => {})
    }
    setCargando(false)
  }, [])

  const handleLogin = (user) => {
    // Limpiar flags de CUN 360: este login NO viene desde CUN 360
    localStorage.removeItem('cun360_origen')
    localStorage.removeItem('cun360_return_url')
    setUsuario(user)
    setPerfilCompleto(!!user.nombre)
    // Cargar la config de marca correcta para la empresa del usuario
    client.get('/config-marca')
      .then((res) => { if (res?.data) guardarConfigMarca(res.data) })
      .catch(() => {})
  }

  const handleRegistroCompleto = (userActualizado) => {
    const user = { ...(usuario || {}), ...userActualizado }
    localStorage.setItem('usuario', JSON.stringify(user))
    // Limpiar flags de CUN 360: registro tradicional NO viene desde CUN 360
    localStorage.removeItem('cun360_origen')
    localStorage.removeItem('cun360_return_url')
    setUsuario(user)
    setPerfilCompleto(true)
    setPreRegistro(null)
    // Mostrar tutorial despues del registro
    setMostrarTutorial(true)
  }

  const handleCerrarSesion = () => {
    const origenCun = localStorage.getItem('cun360_origen')
    const returnUrl = localStorage.getItem('cun360_return_url')

    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('config_marca')
    localStorage.removeItem('cun360_origen')
    localStorage.removeItem('cun360_return_url')

    // Si vino desde CUN 360, redirigir alla en vez de mostrar login
    if (origenCun === 'true' && returnUrl) {
      window.location.href = returnUrl
      return
    }

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
      <Dashboard usuario={usuario} onCerrarSesion={handleCerrarSesion} onAbrirTutorial={() => setMostrarTutorial(true)} />
      {mostrarTutorial && (
        <TutorialDemo
          onTerminar={() => setMostrarTutorial(false)}
          onIrA={() => {}}
        />
      )}
    </>
  )
}
