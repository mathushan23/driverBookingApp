import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
})

const savedUser = JSON.parse(localStorage.getItem('goride:user') || 'null')
if (savedUser?.token) {
  api.defaults.headers.common.Authorization = `Bearer ${savedUser.token}`
}
