import { useState } from 'react'
import Login from './pages/login'
import Registro from './pages/Registro'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [perfilCompleto, setPerfilCompleto] = useState(false)

  const handleLogin = (user, perfil) => {
    setUsuario(user)
    setPerfilCompleto(!!perfil)
  }

  if (!usuario) return <Login onLoginExitoso={handleLogin} />
  if (!perfilCompleto) return <Registro usuario={usuario} onRegistroCompleto={() => setPerfilCompleto(true)} />
  return <div style={{ color: 'white', background: '#231F20', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <h1>¡Bienvenido {usuario.displayName || usuario.email}! 🏆</h1>
  </div>
}