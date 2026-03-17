import { useState } from 'react'
import Login from './pages/login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [perfilCompleto, setPerfilCompleto] = useState(false)

  const handleLogin = (user, perfil) => {
    setUsuario(user)
    setPerfilCompleto(!!perfil)
  }

  const handleCerrarSesion = () => {
    setUsuario(null)
    setPerfilCompleto(false)
  }

  if (!usuario) return <Login onLoginExitoso={handleLogin} />
  if (!perfilCompleto) return <Registro usuario={usuario} onRegistroCompleto={() => setPerfilCompleto(true)} />
  return <Dashboard usuario={usuario} onCerrarSesion={handleCerrarSesion} />
}