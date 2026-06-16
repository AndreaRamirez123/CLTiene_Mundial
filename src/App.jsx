import { useState, useEffect, useRef } from 'react'
import { aplicarConfigMarca, guardarConfigMarca } from './utils/marca'
import { sGet, sSet, sRemove, getEmpresaSlug } from './utils/storage'
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
    const cache = sGet('config_marca')
    if (cache) {
      try { aplicarConfigMarca(JSON.parse(cache)) } catch { /* ignore */ }
    }

    // SSO CUN 360: detectar parametros en la URL
    const params = new URLSearchParams(window.location.search)
    const ssoUser = params.get('user')
    const ssoSession = params.get('session')

    // Ruta por empresa: si viene ?empresa=slug mostrar siempre el login de esa empresa
    const empresaParam = params.get('empresa') || params.get('org')
    if (empresaParam) {
      setCargando(false)
      return
    }

    // Opcion C (preferida): token de sesion temporal server-to-server
    if (ssoSession) {
      // Siempre hacer return si hay session en URL, incluso si ya se disparo
      // (evita que StrictMode cargue al usuario previo del localStorage)
      if (!ssoEjecutado.current) {
        ssoEjecutado.current = true
        // Limpiar sesion previa antes de iniciar SSO
        sRemove('token')
        sRemove('usuario')
        sRemove('config_marca')
        client.post('/auth/sso-session', { session_token: ssoSession })
          .then(({ data }) => {
            sSet('token', data.token)
            sSet('usuario', JSON.stringify(data.usuario || data.user || data.jugador))
            sSet('cun360_origen', 'true')
            const returnUrl = params.get('return') || document.referrer || 'https://cun360.cun.edu.co'
            sSet('cun360_return_url', returnUrl)
            const usuarioData = data.usuario || data.user || data.jugador

            sSet('token', data.token)
            sSet('usuario', JSON.stringify(usuarioData))
            sSet('cun360_origen', 'true')

            const returnUrl = params.get('return') || document.referrer || 'https://cun360.cun.edu.co'
            sSet('cun360_return_url', returnUrl)

            setUsuario(usuarioData)
            setPerfilCompleto(true)
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
        sRemove('token')
        sRemove('usuario')
        sRemove('config_marca')
        client.post('/auth/sso-cun', { email: ssoUser, empresa_slug: 'cun' })
          .then(({ data }) => {
            sSet('token', data.token)
            sSet('usuario', JSON.stringify(data.usuario))
            sSet('cun360_origen', 'true')
            const returnUrl = params.get('return') || document.referrer || 'https://cun360.cun.edu.co'
            sSet('cun360_return_url', returnUrl)
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

    const token = sGet('token')
    const usuarioGuardado = sGet('usuario')

    if (token && usuarioGuardado) {
      const user = JSON.parse(usuarioGuardado)
      // El storage ya está aislado por prefijo de empresa — nada adicional que verificar
      setUsuario(user)
      setPerfilCompleto(!!user.nombre)
      client.get('/config-marca')
        .then((res) => {
          if (res?.data) {
            const cached = sGet('config_marca')
            const cachedId = cached ? JSON.parse(cached)?.empresa_id : null
            guardarConfigMarca(res.data)
            if (cachedId && cachedId !== res.data.empresa_id) {
              window.location.reload()
            }
          }
        })
        .catch(() => { })
    }
    setCargando(false)
  }, [])

  const handleLogin = (user) => {
    sRemove('cun360_origen')
    sRemove('cun360_return_url')
    // Navegar al path de la empresa para aislar el localStorage
    const slug = getEmpresaSlug()
    const targetPath = `/${slug}`
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, document.title, targetPath)
    }
    setUsuario(user)
    setPerfilCompleto(!!user.nombre)
    client.get('/config-marca')
      .then((res) => { if (res?.data) guardarConfigMarca(res.data) })
      .catch(() => { })
  }

  const handleRegistroCompleto = (userActualizado) => {
    const user = { ...(usuario || {}), ...userActualizado }
    sSet('usuario', JSON.stringify(user))
    // Limpiar flags de CUN 360: registro tradicional NO viene desde CUN 360
    sRemove('cun360_origen')
    sRemove('cun360_return_url')
    setUsuario(user)
    setPerfilCompleto(true)
    setPreRegistro(null)
    // Mostrar tutorial despues del registro
    setMostrarTutorial(true)
  }

  const handleCerrarSesion = () => {
    const origenCun = sGet('cun360_origen')
    const returnUrl = sGet('cun360_return_url')
    const slug = getEmpresaSlug()

    sRemove('token')
    sRemove('usuario')
    sRemove('config_marca')
    sRemove('cun360_origen')
    sRemove('cun360_return_url')
    sRemove('empresa_slug_login')

    // Si vino desde CUN 360, redirigir alla en vez de mostrar login
    if (origenCun === 'true' && returnUrl) {
      window.location.href = returnUrl
      return
    }

    // Redirigir al path de la empresa para ver su login
    window.location.href = `/${slug}`
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
          onIrA={() => { }}
        />
      )}
    </>
  )
}
