import axios from 'axios'
import useAuthStore from '../store/auth.store'

const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use((config) => {
    // Obtenemos el estado actual del store sin usar hook de React
    const token = useAuthStore.getState().token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  })

  return client
}

export const libraryApi = createApiClient(import.meta.env.VITE_LIBRARY_API_URL)
export const statisticsApi = createApiClient(import.meta.env.VITE_STATISTICS_API_URL)
