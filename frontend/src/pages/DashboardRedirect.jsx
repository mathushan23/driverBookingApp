import { Navigate } from 'react-router-dom'
import { dashboardPathFor } from '../services/authStorage'

export function DashboardRedirect({ user }) {
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboardingComplete && user.role !== 'admin') return <Navigate to="/onboarding" replace />
  return <Navigate to={dashboardPathFor(user.role)} replace />
}
