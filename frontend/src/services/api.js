import axios from 'axios'

const apiBaseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '')

export const api = axios.create({
  baseURL: apiBaseURL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
