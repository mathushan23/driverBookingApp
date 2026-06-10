import { Navigate } from 'react-router-dom'
import { dashboardPathFor, shouldShowDriverWelcome } from '../services/authStorage'

export function DashboardRedirect({ user }) {
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboardingComplete && user.role !== 'admin') return <Navigate to="/onboarding" replace />
  if (user.role === 'driver' && (!user.driverApproved || shouldShowDriverWelcome(user))) return <Navigate to="/driver/welcome" replace />
  return <Navigate to={dashboardPathFor(user.role)} replace />
}
