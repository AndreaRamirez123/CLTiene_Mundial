import axios from 'axios'
import { sGet, sRemove } from '../utils/storage'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
if (import.meta.env.MODE === 'production' && !import.meta.env.VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL es obligatorio en producción')
}

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Interceptor: agregar token JWT a cada request
client.interceptors.request.use((config) => {
  const token = sGet('token')

  console.log("TOKEN ENCONTRADO:", token)
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Interceptor: si el token expiró o es inválido, limpiar sesión
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    // 401 = token inválido; 403 en rutas de usuario = token expirado o usuario eliminado
    const esRutaAuth = url.includes('/jugadores/') || url.includes('/config-marca') || url.includes('/partidos') || url.includes('/ranking')
    if (status === 401 || (status === 403 && esRutaAuth)) {
      sRemove('token')
      sRemove('usuario')
      sRemove('config_marca')
    }
    return Promise.reject(error)
  }
)

export default client
