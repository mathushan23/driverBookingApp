import { Navigate, useLocation } from 'react-router-dom'

export function ProtectedRoute({ user, children }) {
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export function RoleRoute({ user, allowedRole, children }) {
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboardingComplete && user.role !== 'admin') return <Navigate to="/onboarding" replace />
  if (user.role !== allowedRole) return <Navigate to="/dashboard" replace />
  return children
}
