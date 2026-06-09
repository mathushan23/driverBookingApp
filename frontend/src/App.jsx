import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AdminDashboard } from './pages/AdminDashboard'
import { DashboardRedirect } from './pages/DashboardRedirect'
import { DriverDashboard } from './pages/driver/DriverDashboard'
import { DriverRideDetailsPage } from './pages/driver/DriverRideDetailsPage'
import { DriverRideHistoryPage } from './pages/driver/DriverRideHistoryPage'
import { DriverWelcomePage } from './pages/driver/DriverWelcomePage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { RiderDashboard } from './pages/rider/RiderDashboard'
import { RiderBookingWaitingPage } from './pages/rider/RiderBookingWaitingPage'
import { RiderRideDetailsPage } from './pages/rider/RiderRideDetailsPage'
import { RiderRideHistoryPage } from './pages/rider/RiderRideHistoryPage'
import { RiderWelcomePage } from './pages/rider/RiderWelcomePage'
import { SignupPage } from './pages/SignupPage'
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute'
import { clearAuthSession, getStoredUser } from './services/authStorage'
import './App.css'

function App() {
  const [user, setUser] = useState(() => getStoredUser())

  const saveUser = (nextUser) => setUser(nextUser)

  return (
    <BrowserRouter>
      <AppRoutes user={user} saveUser={saveUser} />
    </BrowserRouter>
  )
}

function AppRoutes({ user, saveUser }) {
  const navigate = useNavigate()

  const logout = () => {
    clearAuthSession()
    saveUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage saveUser={saveUser} />} />
      <Route path="/dashboard" element={<DashboardRedirect user={user} />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute user={user}>
            <OnboardingPage user={user} saveUser={saveUser} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider/welcome"
        element={
          <RoleRoute user={user} allowedRole="rider">
            <RiderWelcomePage />
          </RoleRoute>
        }
      />
      <Route
        path="/rider/dashboard"
        element={
          <RoleRoute user={user} allowedRole="rider">
            <RiderDashboard user={user} logout={logout} />
          </RoleRoute>
        }
      />
      <Route
        path="/rider/booking/:bookingId"
        element={
          <RoleRoute user={user} allowedRole="rider">
            <RiderBookingWaitingPage user={user} />
          </RoleRoute>
        }
      />
      <Route
        path="/rider/history"
        element={
          <RoleRoute user={user} allowedRole="rider">
            <RiderRideHistoryPage user={user} logout={logout} />
          </RoleRoute>
        }
      />
      <Route
        path="/rider/rides/:bookingId"
        element={
          <RoleRoute user={user} allowedRole="rider">
            <RiderRideDetailsPage user={user} logout={logout} />
          </RoleRoute>
        }
      />

      <Route
        path="/driver/welcome"
        element={
          <RoleRoute user={user} allowedRole="driver">
            <DriverWelcomePage />
          </RoleRoute>
        }
      />
      <Route
        path="/driver/dashboard"
        element={
          <RoleRoute user={user} allowedRole="driver">
            <DriverDashboard user={user} logout={logout} />
          </RoleRoute>
        }
      />
      <Route
        path="/driver/history"
        element={
          <RoleRoute user={user} allowedRole="driver">
            <DriverRideHistoryPage user={user} logout={logout} />
          </RoleRoute>
        }
      />
      <Route
        path="/driver/rides/:bookingId"
        element={
          <RoleRoute user={user} allowedRole="driver">
            <DriverRideDetailsPage user={user} />
          </RoleRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute user={user} allowedRole="admin">
            <AdminDashboard user={user} logout={logout} />
          </RoleRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App

