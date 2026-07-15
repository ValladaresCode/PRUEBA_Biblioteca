import axios from 'axios'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export function registerUser({ name, email, password }) {
  return authApi.post('/auth/register', { name, email, password })
}

export function loginUser({ email, password }) {
  return authApi.post('/auth/login', { email, password })
}
