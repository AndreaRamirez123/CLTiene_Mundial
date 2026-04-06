import axios from 'axios'

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
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: si el token expiró, limpiar sesión
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    }
    return Promise.reject(error)
  }
)

export default client
