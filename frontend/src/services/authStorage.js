const AUTH_USER_KEY = 'ride:user'
const TOKEN_KEY = 'token'
const ROLE_KEY = 'role'
const FIRST_LOGIN_KEY = 'firstLogin'

export function getStoredUser() {
  const saved = localStorage.getItem(AUTH_USER_KEY)
  return saved ? JSON.parse(saved) : null
}

export function setAuthSession(user) {
  const firstLogin = !user.onboardingComplete && user.role !== 'admin'

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, user.token)
  localStorage.setItem(ROLE_KEY, user.role || '')
  localStorage.setItem(FIRST_LOGIN_KEY, String(firstLogin))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(FIRST_LOGIN_KEY)
}

export function isFirstLogin() {
  return localStorage.getItem(FIRST_LOGIN_KEY) === 'true'
}

export function dashboardPathFor(role) {
  if (role === 'driver') return '/driver/dashboard'
  if (role === 'admin') return '/admin/dashboard'
  return '/rider/dashboard'
}

export function welcomePathFor(role) {
  return role === 'driver' ? '/driver/welcome' : '/rider/welcome'
}
