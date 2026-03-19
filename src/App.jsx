import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import client from './api/client'
import Login from './pages/login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [perfilCompleto, setPerfilCompleto] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user)
        try {
          const res = await client.get(`/jugadores/${user.uid}`)
          setPerfilCompleto(!!res.data)
        } catch {
          setPerfilCompleto(false)
        }
      } else {
        setUsuario(null)
        setPerfilCompleto(false)
      }
      setCargando(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = (user, perfil) => {
    setUsuario(user)
    setPerfilCompleto(!!perfil)
  }

  const handleCerrarSesion = () => {
    setUsuario(null)
    setPerfilCompleto(false)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#FD7751', fontSize: 18, fontWeight: 700 }}>Cargando...</div>
    </div>
  )

  if (!usuario) return <Login onLoginExitoso={handleLogin} />
  if (!perfilCompleto) return <Registro usuario={usuario} onRegistroCompleto={() => setPerfilCompleto(true)} />
  return <Dashboard usuario={usuario} onCerrarSesion={handleCerrarSesion} />
}